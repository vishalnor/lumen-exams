import React, { useState, useEffect } from 'react';
import { User, Question } from './types';
import { LoginScreen } from './components/LoginScreen';
import { CandidateStartScreen } from './components/CandidateStartScreen';
import { ExamInterface } from './components/ExamInterface';
import { ResultScreen } from './components/ResultScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { seedFirestoreIfEmpty } from './services/firebaseDb';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // App views: 'candidate-start' | 'exam' | 'result' | 'admin-login' | 'admin-console'
  const [view, setView] = useState<'candidate-start' | 'exam' | 'result' | 'admin-login' | 'admin-console'>('candidate-start');

  // Candidate / Exam session state
  const [targetExamId, setTargetExamId] = useState<string>('exam-cyber');
  const [targetExamTitle, setTargetExamTitle] = useState<string>('Cyber');
  const [targetExamDuration, setTargetExamDuration] = useState<number>(30);
  const [targetExamQuestionsCount, setTargetExamQuestionsCount] = useState<number>(3);
  const [targetExamInstructions, setTargetExamInstructions] = useState<string>('Answer all multiple-choice questions.');
  
  const [activeCandidateName, setActiveCandidateName] = useState<string>('');
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [activeRemainingSeconds, setActiveRemainingSeconds] = useState<number>(1800);

  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Parse URL search params (e.g. ?exam=exam-webtech or ?exam=exam-cyber)
  useEffect(() => {
    seedFirestoreIfEmpty();

    const params = new URLSearchParams(window.location.search);
    const examParam = params.get('exam');
    const examIdToLoad = examParam || 'exam-cyber';
    setTargetExamId(examIdToLoad);

    // Fetch exam info
    fetch(`/api/public/exams/${examIdToLoad}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setTargetExamTitle(data.title || 'Cyber');
          setTargetExamDuration(data.durationMinutes || 30);
          setTargetExamQuestionsCount(data.questionCount || 3);
          setTargetExamInstructions(data.instructions || 'Answer all multiple-choice questions.');
        }
      })
      .catch(() => {});

    // Check if admin token is saved
    const savedToken = localStorage.getItem('LUMEN_ADMIN_TOKEN');
    if (savedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((userData) => {
          if (userData && userData.role === 'admin') {
            setUser(userData);
            setToken(savedToken);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Candidate starts exam with just full name (NO login required!)
  const handleCandidateStart = async (name: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/attempts/start-anonymous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: targetExamId,
          studentName: name,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to start examination');
      }

      const data = await res.json();
      setActiveCandidateName(data.studentName || name);
      setActiveAttemptId(data.attemptId);
      setActiveQuestions(data.questions || []);
      setActiveRemainingSeconds(data.remainingSeconds || targetExamDuration * 60);
      setView('exam');
    } catch (err: any) {
      alert(err.message || 'Error launching examination');
    } finally {
      setLoading(false);
    }
  };

  // Exam submitted
  const handleExamSubmitted = (attemptId: string) => {
    setActiveAttemptId(attemptId);
    setView('result');
  };

  // Helper for safe JSON response parsing
  const parseResponse = async (res: Response, fallbackMsg: string) => {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      if (text.includes('could not be found') || res.status === 404) {
        throw new Error('API server route not found (404). Check your Vercel deployment.');
      }
      throw new Error(`Server returned status ${res.status}`);
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || fallbackMsg);
    }
    return data;
  };

  // Admin Login
  const handleAdminLogin = async (email: string, pass: string) => {
    setLoading(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await parseResponse(res, 'Invalid email or password');
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('LUMEN_ADMIN_TOKEN', data.token);
      setView('admin-console');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Admin Registration
  const handleAdminRegister = async (fullName: string, email: string, pass: string) => {
    setLoading(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password: pass, role: 'admin' }),
      });

      const data = await parseResponse(res, 'Registration rejected');
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('LUMEN_ADMIN_TOKEN', data.token);
      setView('admin-console');
    } catch (err: any) {
      setLoginError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSignOut = () => {
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('LUMEN_ADMIN_TOKEN');
    setView('candidate-start');
  };

  const handleOpenExamAsCandidateFromAdmin = (examId: string) => {
    setTargetExamId(examId);
    fetch(`/api/public/exams/${examId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setTargetExamTitle(data.title || 'Exam');
          setTargetExamDuration(data.durationMinutes || 30);
          setTargetExamQuestionsCount(data.questionCount || 3);
          setTargetExamInstructions(data.instructions || 'Answer all multiple-choice questions.');
        }
        setView('candidate-start');
      });
  };

  return (
    <div className="min-h-screen text-slate-800 antialiased selection:bg-[#5d5fef]/10 selection:text-[#5d5fef]">
      {/* 1. Candidate Name Entry Screen (No login needed!) */}
      {view === 'candidate-start' && (
        <CandidateStartScreen
          examId={targetExamId}
          examTitle={targetExamTitle}
          durationMinutes={targetExamDuration}
          questionCount={targetExamQuestionsCount}
          instructions={targetExamInstructions}
          onStart={handleCandidateStart}
          loading={loading}
          onGoToConsole={() => setView(user && token ? 'admin-console' : 'admin-login')}
        />
      )}

      {/* 2. Proctored Exam Interface matching IMG-20261101-WA0026 and WA0027 */}
      {view === 'exam' && activeAttemptId && (
        <ExamInterface
          candidateName={activeCandidateName}
          attemptId={activeAttemptId}
          examTitle={targetExamTitle}
          initialQuestions={activeQuestions}
          initialRemainingSeconds={activeRemainingSeconds}
          onSubmitted={handleExamSubmitted}
          token={token || undefined}
        />
      )}

      {/* 3. Scored Result Screen matching IMG-20261101-WA0028 */}
      {view === 'result' && activeAttemptId && (
        <ResultScreen
          attemptId={activeAttemptId}
          onBackToHome={() => {
            setActiveAttemptId(null);
            setView('candidate-start');
          }}
        />
      )}

      {/* 4. Admin Sign In Screen matching IMG-20261101-WA0023 */}
      {view === 'admin-login' && (
        <LoginScreen
          onLogin={handleAdminLogin}
          onRegister={handleAdminRegister}
          loading={loading}
          error={loginError}
          clearError={() => setLoginError(null)}
          onTakeExamDirectly={() => setView('candidate-start')}
        />
      )}

      {/* 5. Admin Console matching IMG-20261101-WA0022, WA0025, and WA0024 */}
      {view === 'admin-console' && user && token && (
        <AdminDashboard
          user={user}
          token={token}
          onSignOut={handleAdminSignOut}
          onOpenExamAsCandidate={handleOpenExamAsCandidateFromAdmin}
        />
      )}
    </div>
  );
}
