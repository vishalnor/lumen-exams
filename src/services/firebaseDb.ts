import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Question, Exam, ExamAttempt, Violation, ConsolidatedReportRow } from '../types';

const USERS_COL = 'users';
const QUESTIONS_COL = 'questions';
const EXAMS_COL = 'exams';
const ATTEMPTS_COL = 'attempts';
const VIOLATIONS_COL = 'violations';

// --- SEED FIRESTORE INITIAL DATA (If first time or empty) ---
export async function seedFirestoreIfEmpty() {
  try {
    const qSnap = await getDocs(collection(db, QUESTIONS_COL));
    if (qSnap.empty) {
      console.log('Seeding initial questions to Firebase Firestore...');
      const seedQuestions: Question[] = [
        {
          id: 'q-1',
          text: 'A social engineering attack tailored specifically to deceive high-profile individuals, such as C-level executives or board members, is known as:',
          optionA: 'Smishing',
          optionB: 'Pharming',
          optionC: 'Whaling',
          optionD: 'Vishing',
          correctOption: 2,
          topic: 'Cyber Security',
          createdBy: 'admin@lumen.edu',
        },
        {
          id: 'q-2',
          text: 'Which browser Page Visibility API event and property are used to detect when the user switches away from the examination tab?',
          optionA: 'onblur and document.isFocused',
          optionB: 'visibilitychange and document.hidden',
          optionC: 'tabswitch and window.hidden',
          optionD: 'pageshow and document.visibilityState',
          correctOption: 1,
          topic: 'Proctoring & Web API',
          createdBy: 'admin@lumen.edu',
        },
        {
          id: 'q-3',
          text: 'According to requirement FR-PROC-04, why is the running tab-switch violation count concealed from the student during an examination attempt?',
          optionA: 'To reduce HTTP request body size',
          optionB: 'To prevent students from calibrating how much tab-switching is tolerated',
          optionC: 'Because browsers cannot transmit violation counts securely',
          optionD: 'To simplify database query operations',
          correctOption: 1,
          topic: 'System Security',
          createdBy: 'admin@lumen.edu',
        },
        {
          id: 'q-4',
          text: 'Which browser interface is used to deliver a final proctoring event reliably when an examination window or tab is being closed?',
          optionA: 'navigator.sendBeacon()',
          optionB: 'window.alert()',
          optionC: 'XMLHttpRequest with synchronous mode',
          optionD: 'CSS Media Queries',
          correctOption: 0,
          topic: 'Web API & Networking',
          createdBy: 'admin@lumen.edu',
        },
      ];

      for (const q of seedQuestions) {
        await setDoc(doc(db, QUESTIONS_COL, q.id), q);
      }

      // Seed initial exam
      const seedExam: Exam = {
        id: 'exam-cyber',
        title: 'Cybersecurity & Web Defense',
        description: 'Assessment covering social engineering, network security, and secure application protocols.',
        durationMinutes: 30,
        availableFrom: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        availableTo: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        questionIds: ['q-1', 'q-2', 'q-3', 'q-4'],
        createdBy: 'admin@lumen.edu',
        status: 'published',
      };
      await setDoc(doc(db, EXAMS_COL, seedExam.id), seedExam);
    }
  } catch (err) {
    console.warn('Firestore seed check notice:', err);
  }
}

// --- QUESTIONS ---
export async function getQuestionsFromFirestore(): Promise<Question[]> {
  try {
    const snap = await getDocs(collection(db, QUESTIONS_COL));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Question));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, QUESTIONS_COL);
    return [];
  }
}

export async function saveQuestionToFirestore(question: Question): Promise<void> {
  try {
    await setDoc(doc(db, QUESTIONS_COL, question.id), question);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${QUESTIONS_COL}/${question.id}`);
  }
}

export async function deleteQuestionFromFirestore(questionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, QUESTIONS_COL, questionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${QUESTIONS_COL}/${questionId}`);
  }
}

// --- EXAMS ---
export async function getExamsFromFirestore(): Promise<Exam[]> {
  try {
    const snap = await getDocs(collection(db, EXAMS_COL));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Exam));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, EXAMS_COL);
    return [];
  }
}

export async function saveExamToFirestore(exam: Exam): Promise<void> {
  try {
    await setDoc(doc(db, EXAMS_COL, exam.id), exam);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${EXAMS_COL}/${exam.id}`);
  }
}

// --- ATTEMPTS ---
export async function saveAttemptToFirestore(attempt: ExamAttempt): Promise<void> {
  try {
    await setDoc(doc(db, ATTEMPTS_COL, attempt.id), attempt, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${ATTEMPTS_COL}/${attempt.id}`);
  }
}

export async function getAttemptFromFirestore(attemptId: string): Promise<ExamAttempt | null> {
  try {
    const d = await getDoc(doc(db, ATTEMPTS_COL, attemptId));
    if (!d.exists()) return null;
    return { ...d.data(), id: d.id } as ExamAttempt;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${ATTEMPTS_COL}/${attemptId}`);
    return null;
  }
}

// --- VIOLATIONS ---
export async function saveViolationToFirestore(violation: Violation): Promise<void> {
  try {
    await setDoc(doc(db, VIOLATIONS_COL, violation.id), violation);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${VIOLATIONS_COL}/${violation.id}`);
  }
}

export async function getViolationsForAttempt(attemptId: string): Promise<Violation[]> {
  try {
    const q = query(collection(db, VIOLATIONS_COL), where('attemptId', '==', attemptId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Violation));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, VIOLATIONS_COL);
    return [];
  }
}
