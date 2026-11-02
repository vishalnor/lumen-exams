import type { Request, Response, NextFunction } from 'express';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json';

/**
 * Vercel runs the API as short-lived serverless instances, so module-level arrays
 * are not shared between requests. This middleware loads the current state from
 * Firestore into those arrays before each /api request and writes any changes
 * back before the response is sent. Route handlers stay unchanged.
 *
 * Needs FIREBASE_SERVICE_ACCOUNT (service-account JSON). Without it, persistence
 * is disabled and the server keeps everything in memory (fine for local dev).
 */

type Doc = { id: string };
type Session = { userId: string; role: 'student' | 'admin'; expiresAt: number };

interface State {
  users: Doc[];
  questions: Doc[];
  exams: Doc[];
  attempts: Doc[];
  answers: Doc[];
  violations: Doc[];
  sessions: Map<string, Session>;
}

const COLLECTIONS = ['users', 'questions', 'exams', 'attempts', 'answers', 'violations'] as const;
const SESSIONS = 'sessions';

function getDb(): Firestore | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  const app =
    getApps()[0] ??
    initializeApp({ credential: cert(JSON.parse(raw)), projectId: firebaseConfig.projectId });
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // settings() can only be called once per instance
  }
  return db;
}

const docKey = (id: string) => encodeURIComponent(id);
const clean = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export function createPersistence(state: State) {
  const db = getDb();
  if (!db) {
    console.warn('[persistence] FIREBASE_SERVICE_ACCOUNT not set - data is in-memory only');
    return { middleware: (_req: Request, _res: Response, next: NextFunction) => next(), enabled: false };
  }

  const seed: Record<string, Doc[]> = {};
  for (const name of COLLECTIONS) seed[name] = clean(state[name]);

  // Last-known Firestore content per collection: key -> JSON string of the stored doc.
  const snapshot = new Map<string, Map<string, string>>();
  // Stable ordering for each doc so arrays keep their insertion order across loads.
  const order = new Map<string, number>();
  let orderCounter = 0;

  const nextOrder = () => Date.now() * 1000 + (orderCounter++ % 1000);

  async function load() {
    const empty = (await db!.collection('users').limit(1).get()).empty;

    for (const name of COLLECTIONS) {
      const snap = new Map<string, string>();
      snapshot.set(name, snap);
      const target = state[name];
      if (empty) {
        // First run against an empty database: keep the seed data; persist() will write it.
        target.splice(0, target.length, ...clean(seed[name]));
        continue;
      }
      const res = await db!.collection(name).get();
      const rows = res.docs
        .map((d) => d.data() as Doc & { _o?: number })
        .sort((a, b) => (a._o ?? 0) - (b._o ?? 0));
      const items: Doc[] = [];
      for (const row of rows) {
        const { _o, ...item } = row;
        order.set(`${name}/${item.id}`, _o ?? 0);
        snap.set(item.id, JSON.stringify(item));
        items.push(item as Doc);
      }
      target.splice(0, target.length, ...items);
    }

    const sSnap = new Map<string, string>();
    snapshot.set(SESSIONS, sSnap);
    state.sessions.clear();
    if (!empty) {
      const res = await db!.collection(SESSIONS).get();
      const now = Date.now();
      for (const d of res.docs) {
        const { token, ...s } = d.data() as Session & { token: string };
        if (s.expiresAt > now) {
          state.sessions.set(token, s);
          sSnap.set(token, JSON.stringify(s));
        }
      }
    }
  }

  async function persist() {
    const batch = db!.batch();
    let ops = 0;

    const diff = (
      name: string,
      current: Map<string, any>,
      toDoc: (key: string, value: any) => object,
    ) => {
      const before = snapshot.get(name)!;
      for (const [key, value] of current) {
        const json = JSON.stringify(value);
        if (before.get(key) === json) continue;
        const orderKey = `${name}/${key}`;
        if (!order.has(orderKey)) order.set(orderKey, nextOrder());
        batch.set(db!.collection(name).doc(docKey(key)), { ...toDoc(key, value), _o: order.get(orderKey) });
        ops++;
      }
      for (const key of before.keys()) {
        if (!current.has(key)) {
          batch.delete(db!.collection(name).doc(docKey(key)));
          ops++;
        }
      }
    };

    for (const name of COLLECTIONS) {
      const current = new Map<string, any>();
      for (const item of state[name]) current.set(item.id, clean(item));
      diff(name, current, (_k, v) => v);
    }
    const sessions = new Map<string, any>();
    for (const [token, s] of state.sessions) sessions.set(token, clean(s));
    diff(SESSIONS, sessions, (token, v) => ({ token, ...v }));

    if (ops > 0) {
      // Firestore batches are limited to 500 writes; fall back to chunking for big changes.
      if (ops <= 500) await batch.commit();
      else await persistChunked();
    }
  }

  async function persistChunked() {
    // Rare path (e.g. first seed of a large dataset): write documents individually.
    const writes: Promise<unknown>[] = [];
    for (const name of COLLECTIONS) {
      const before = snapshot.get(name)!;
      const current = new Set<string>();
      for (const item of state[name]) {
        current.add(item.id);
        const json = JSON.stringify(clean(item));
        if (before.get(item.id) === json) continue;
        const orderKey = `${name}/${item.id}`;
        if (!order.has(orderKey)) order.set(orderKey, nextOrder());
        writes.push(
          db!.collection(name).doc(docKey(item.id)).set({ ...clean(item), _o: order.get(orderKey) }),
        );
      }
      for (const id of before.keys()) {
        if (!current.has(id)) writes.push(db!.collection(name).doc(docKey(id)).delete());
      }
    }
    for (const [token, s] of state.sessions) {
      writes.push(db!.collection(SESSIONS).doc(docKey(token)).set({ token, ...clean(s) }));
    }
    await Promise.all(writes);
  }

  // Requests share the module-level arrays, so handle them one at a time.
  let queue: Promise<unknown> = Promise.resolve();

  function middleware(req: Request, res: Response, next: NextFunction) {
    if (!req.path.startsWith('/api')) return next();

    const run = async () => {
      await load();

      // Persist changes before the response goes out: serverless instances may be
      // frozen as soon as the response finishes.
      const origEnd = res.end.bind(res) as (...a: any[]) => Response;
      let finished: () => void;
      const done = new Promise<void>((r) => (finished = r));
      (res as any).end = (...args: any[]) => {
        persist()
          .catch((err) => console.error('[persistence] failed to save:', err))
          .finally(() => {
            origEnd(...args);
            finished();
          });
        return res;
      };
      res.on('close', () => finished());

      next();
      await done;
    };

    queue = queue
      .then(run)
      .catch((err) => {
        console.error('[persistence] failed to load:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Database unavailable' });
      });
  }

  return { middleware, enabled: true };
}
