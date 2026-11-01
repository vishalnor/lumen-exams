import React, { useState, useEffect } from 'react';
import { User } from './types';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { StudentDashboard } from './components/StudentDashboard';
import { ExamInterface } from './components/ExamInterface';
import { ResultScreen } from './components/ResultScreen';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState<'login' | 'dashboard' | 'exam' | 'result' | 'admin'>('dashboard');
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Auto-login as demo Student on first visit for instant frictionless access
  useEffect(() => {
    const savedToken = localStorage.getItem('LUMEN_AUTH_TOKEN');
    if (savedToken) {
      setToken(savedToken);
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Invalid token');
        })
        .then((userData) => {
          setUser(userData);
          setView(userData.role === 'admin' ? 'admin' : 'dashboard');
        })
        .catch(() => {
          // Fall back to student default
          quickLogin('vikas@student.edu', 'Student@123');
        });
    } else {
      quickLogin('vikas@student.edu', 'Student@123');
    }
  }, []);

  const quickLogin = async (email: string, pass: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('LUMEN_AUTH_TOKEN', data.token);
        setView(data.user.role === 'admin' ? 'admin' : 'dashboard');
      }
    } catch {
      // offline / starting up
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    setLoading(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('LUMEN_AUTH_TOKEN', data.token);
      setView(data.user.role === 'admin' ? 'admin' : 'dashboard');
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials (HTTP 401)');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (
    fullName: string,
    email: string,
    pass: string,
    role: 'student' | 'admin'
  ) => {
    setLoading(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password: pass, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('LUMEN_AUTH_TOKEN', data.token);
      setView(data.user.role === 'admin' ? 'admin' : 'dashboard');
    } catch (err: any) {
      setLoginError(err.message || 'Registration rejected');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('LUMEN_AUTH_TOKEN');
    setView('login');
  };

  const handleSwitchUser = async (targetEmail: string) => {
    if (targetEmail.includes('admin')) {
      await quickLogin('admin@lumen.edu', 'Admin@123');
    } else {
      await quickLogin('vikas@student.edu', 'Student@123');
    }
  };

  const handleStartExam = (examId: string) => {
    setActiveExamId(examId);
    setView('exam');
  };

  const handleExamSubmitted = (attemptId: string) => {
    setActiveAttemptId(attemptId);
    setView('result');
  };

  const handleBackToDashboard = () => {
    setActiveExamId(null);
    setActiveAttemptId(null);
    setView(user?.role === 'admin' ? 'admin' : 'dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7fb] text-slate-800">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        activeView={view}
        onNavigate={(newView) => setView(newView as any)}
        examInProgress={view === 'exam'}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {view === 'login' || !user || !token ? (
          <LoginScreen
            onLogin={handleLogin}
            onRegister={handleRegister}
            loading={loading}
            error={loginError}
            clearError={() => setLoginError(null)}
          />
        ) : view === 'dashboard' && user.role === 'student' ? (
          <StudentDashboard
            user={user}
            token={token}
            onStartExam={handleStartExam}
            onViewResult={(attemptId) => {
              setActiveAttemptId(attemptId);
              setView('result');
            }}
          />
        ) : view === 'exam' && user.role === 'student' && activeExamId ? (
          <ExamInterface
            user={user}
            token={token}
            examId={activeExamId}
            onSubmitted={handleExamSubmitted}
            onExit={handleBackToDashboard}
          />
        ) : view === 'result' && activeAttemptId ? (
          <ResultScreen
            user={user}
            token={token}
            attemptId={activeAttemptId}
            onBackToDashboard={handleBackToDashboard}
          />
        ) : user.role === 'admin' ? (
          <AdminDashboard user={user} token={token} />
        ) : (
          <StudentDashboard
            user={user}
            token={token}
            onStartExam={handleStartExam}
            onViewResult={(attemptId) => {
              setActiveAttemptId(attemptId);
              setView('result');
            }}
          />
        )}
      </main>
    </div>
  );
}
