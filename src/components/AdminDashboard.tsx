import React, { useState, useEffect } from 'react';
import { User, Exam, Question, ConsolidatedReportRow } from '../types';
import {
  Copy,
  Check,
  Download,
  Trash2,
  Clock,
  HelpCircle,
  Cpu,
  BookOpen,
  Terminal,
  RefreshCw,
  Plus,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  X,
} from 'lucide-react';
import { GeminiAiModal } from './GeminiAiModal';
import { ViolationAuditModal } from './ViolationAuditModal';
import { TestSuiteViewer } from './TestSuiteViewer';

interface AdminDashboardProps {
  user: User;
  token: string;
  onSignOut: () => void;
  onOpenExamAsCandidate?: (examId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  token,
  onSignOut,
  onOpenExamAsCandidate,
}) => {
  // Navigation states: 'overview' (Figure 2), 'responses' (Figure 3), 'settings' (Figure 4), 'questions', 'testsuite'
  const [adminView, setAdminView] = useState<'overview' | 'responses' | 'settings' | 'questions' | 'testsuite'>('overview');
  const [activeExam, setActiveExam] = useState<Exam | null>(null);

  // Data states
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reportRows, setReportRows] = useState<ConsolidatedReportRow[]>([]);
  const [copiedExamId, setCopiedExamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modals & specific exam actions
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [isManualQuestionModalOpen, setIsManualQuestionModalOpen] = useState(false);
  const [selectedAuditRow, setSelectedAuditRow] = useState<ConsolidatedReportRow | null>(null);

  // Settings form state (matching Figure 4)
  const [settingsTitle, setSettingsTitle] = useState('');
  const [settingsInstructions, setSettingsInstructions] = useState('Answer all multiple-choice questions.');
  const [settingsDuration, setSettingsDuration] = useState(30);
  const [settingsPassingScore, setSettingsPassingScore] = useState(0);
  const [settingsMaxAttempts, setSettingsMaxAttempts] = useState(1);
  const [settingsAllowedTabSwitches, setSettingsAllowedTabSwitches] = useState(1);
  const [settingsShowResult, setSettingsShowResult] = useState(true);
  const [settingsAutoSubmitOnTabLimit, setSettingsAutoSubmitOnTabLimit] = useState(false);
  const [settingsSavedNotice, setSettingsSavedNotice] = useState(false);

  // Question Creation Form State
  const [newQText, setNewQText] = useState('');
  const [newQOptA, setNewQOptA] = useState('');
  const [newQOptB, setNewQOptB] = useState('');
  const [newQOptC, setNewQOptC] = useState('');
  const [newQOptD, setNewQOptD] = useState('');
  const [newQCorrect, setNewQCorrect] = useState<number>(0);
  const [newQTopic, setNewQTopic] = useState('Cyber Security');

  // Default initial data for resilient offline or static Vercel deployment
  const DEFAULT_INITIAL_EXAMS: Exam[] = [
    {
      id: 'exam-cyber',
      title: 'Cyber Security & Network Defense',
      instructions: 'Answer all multiple-choice questions. Tab switching and exiting fullscreen are actively monitored.',
      durationMinutes: 30,
      passingScore: 0,
      maxAttempts: 1,
      allowedTabSwitches: 1,
      showResultAfterSubmission: true,
      autoSubmitOnTabLimit: false,
      status: 'published',
      createdBy: 'user-admin-1',
      createdAt: new Date('2026-09-01T09:00:00Z').toISOString(),
      questionCount: 3,
      questionIds: ['q-1', 'q-2', 'q-3'],
    },
    {
      id: 'exam-webtech',
      title: 'Web Development & Security Architecture',
      instructions: 'Comprehensive assessment of web application security, CORS, authentication tokens, and modern client-server architecture.',
      durationMinutes: 45,
      passingScore: 50,
      maxAttempts: 2,
      allowedTabSwitches: 2,
      showResultAfterSubmission: true,
      autoSubmitOnTabLimit: false,
      status: 'draft',
      createdBy: 'user-admin-1',
      createdAt: new Date('2026-09-05T10:00:00Z').toISOString(),
      questionCount: 2,
      questionIds: ['q-4', 'q-5'],
    },
  ];

  const DEFAULT_INITIAL_QUESTIONS: Question[] = [
    {
      id: 'q-1',
      text: 'A social engineering attack tailored specifically to deceive high-profile individuals, such as C-level executives or board members, is known as:',
      optionA: 'Smishing',
      optionB: 'Pharming',
      optionC: 'Whaling',
      optionD: 'Vishing',
      correctOption: 2,
      topic: 'Cyber Security',
      examId: 'exam-cyber',
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
      examId: 'exam-cyber',
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
      examId: 'exam-cyber',
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
      examId: 'exam-webtech',
    },
    {
      id: 'q-5',
      text: 'In the system architecture, why is remaining exam time computed from the server-recorded start time rather than a client countdown?',
      optionA: 'To save browser memory and CPU cycles',
      optionB: 'Client clocks can drift or be tampered with; the server must be the timing authority',
      optionC: 'JavaScript cannot calculate countdown intervals',
      optionD: 'To avoid using WebSocket connections',
      correctOption: 1,
      topic: 'System Architecture',
      examId: 'exam-webtech',
    },
  ];

  // Fetch Exams with resilient fallback
  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setExams(data);
          localStorage.setItem('LUMEN_EXAMS', JSON.stringify(data));
          if (!activeExam) {
            setActiveExam(data[0]);
          }
          return;
        }
      }
    } catch {}

    const savedExams = localStorage.getItem('LUMEN_EXAMS');
    if (savedExams) {
      try {
        const parsed = JSON.parse(savedExams);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setExams(parsed);
          if (!activeExam) setActiveExam(parsed[0]);
          return;
        }
      } catch {}
    }
    setExams(DEFAULT_INITIAL_EXAMS);
    if (!activeExam) setActiveExam(DEFAULT_INITIAL_EXAMS[0]);
    localStorage.setItem('LUMEN_EXAMS', JSON.stringify(DEFAULT_INITIAL_EXAMS));
  };

  // Fetch Questions with resilient fallback
  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/questions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setQuestions(data);
          localStorage.setItem('LUMEN_QUESTIONS', JSON.stringify(data));
          return;
        }
      }
    } catch {}

    const savedQ = localStorage.getItem('LUMEN_QUESTIONS');
    if (savedQ) {
      try {
        const parsed = JSON.parse(savedQ);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuestions(parsed);
          return;
        }
      } catch {}
    }
    setQuestions(DEFAULT_INITIAL_QUESTIONS);
    localStorage.setItem('LUMEN_QUESTIONS', JSON.stringify(DEFAULT_INITIAL_QUESTIONS));
  };

  // Fetch Reports for active exam
  const fetchReport = async (examId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${examId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setReportRows(data.rows || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
    fetchQuestions();
  }, [token]);

  useEffect(() => {
    if (activeExam) {
      setSettingsTitle(activeExam.title);
      setSettingsInstructions(activeExam.instructions || 'Answer all multiple-choice questions.');
      setSettingsDuration(activeExam.durationMinutes || 30);
      setSettingsPassingScore(activeExam.passingScore ?? 0);
      setSettingsMaxAttempts(activeExam.maxAttempts ?? 1);
      setSettingsAllowedTabSwitches(activeExam.allowedTabSwitches ?? 1);
      setSettingsShowResult(activeExam.showResultAfterSubmission ?? true);
      setSettingsAutoSubmitOnTabLimit(activeExam.autoSubmitOnTabLimit ?? false);

      if (adminView === 'responses') {
        fetchReport(activeExam.id);
      }
    }
  }, [activeExam, adminView]);

  // Copy shareable exam link
  const copyExamLink = (examId: string) => {
    const url = `${window.location.origin}/?exam=${examId}`;
    navigator.clipboard.writeText(url);
    setCopiedExamId(examId);
    setTimeout(() => setCopiedExamId(null), 2500);
  };

  // Save Settings (Figure 4)
  const handleSaveSettings = async () => {
    if (!activeExam) return;
    try {
      const res = await fetch(`/api/exams/${activeExam.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: settingsTitle,
          instructions: settingsInstructions,
          durationMinutes: settingsDuration,
          passingScore: settingsPassingScore,
          maxAttempts: settingsMaxAttempts,
          allowedTabSwitches: settingsAllowedTabSwitches,
          showResultAfterSubmission: settingsShowResult,
          autoSubmitOnTabLimit: settingsAutoSubmitOnTabLimit,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setActiveExam(updated);
        fetchExams();
        setSettingsSavedNotice(true);
        setTimeout(() => setSettingsSavedNotice(false), 3000);
      }
    } catch {}
  };

  // Toggle Publish / Unpublish
  const handleTogglePublish = async () => {
    if (!activeExam) return;
    const newStatus = activeExam.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/exams/${activeExam.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveExam(updated);
        fetchExams();
      }
    } catch {}
  };

  // Delete Exam (with local state and storage guarantee)
  const handleDeleteExam = async (examId: string) => {
    try {
      fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    } finally {
      setExams((prev) => {
        const remaining = prev.filter((e) => e.id !== examId);
        localStorage.setItem('LUMEN_EXAMS', JSON.stringify(remaining));
        return remaining;
      });
      if (activeExam?.id === examId) {
        const remaining = exams.filter((e) => e.id !== examId);
        setActiveExam(remaining.length > 0 ? remaining[0] : null);
        setAdminView('overview');
      }
      setExamToDelete(null);
    }
  };

  // Remove question from specific exam
  const handleRemoveQuestionFromExam = async (examId: string, questionId: string) => {
    try {
      fetch(`/api/exams/${examId}/questions/${questionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    } finally {
      if (activeExam && activeExam.id === examId) {
        const updatedQuestionIds = (activeExam.questionIds || []).filter((id) => id !== questionId);
        const updatedExam = {
          ...activeExam,
          questionIds: updatedQuestionIds,
          questionCount: updatedQuestionIds.length,
        };
        setActiveExam(updatedExam);
        setExams((prev) => {
          const updated = prev.map((e) => (e.id === examId ? updatedExam : e));
          localStorage.setItem('LUMEN_EXAMS', JSON.stringify(updated));
          return updated;
        });
      }
    }
  };

  // Create Question directly for activeExam
  const handleCreateQuestionForExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExam) return;
    const newQuestionId = 'q-' + Date.now();
    const tempQuestion: Question = {
      id: newQuestionId,
      text: newQText,
      optionA: newQOptA,
      optionB: newQOptB,
      optionC: newQOptC,
      optionD: newQOptD,
      correctOption: newQCorrect,
      topic: newQTopic || activeExam.title,
      examId: activeExam.id,
      createdBy: user.email,
    };

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: newQText,
          optionA: newQOptA,
          optionB: newQOptB,
          optionC: newQOptC,
          optionD: newQOptD,
          correctOption: newQCorrect,
          topic: newQTopic || activeExam.title,
          examId: activeExam.id,
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setQuestions((prev) => [data, ...prev]);
        if (data.exam) {
          setActiveExam(data.exam);
        }
      } else {
        throw new Error('Offline fallback');
      }
    } catch {
      // Resilient local state & storage
      setQuestions((prev) => {
        const updated = [tempQuestion, ...prev];
        localStorage.setItem('LUMEN_QUESTIONS', JSON.stringify(updated));
        return updated;
      });
      const updatedQuestionIds = [...(activeExam.questionIds || []), newQuestionId];
      const updatedExam = {
        ...activeExam,
        questionIds: updatedQuestionIds,
        questionCount: updatedQuestionIds.length,
      };
      setActiveExam(updatedExam);
      setExams((prev) => {
        const updated = prev.map((e) => (e.id === activeExam.id ? updatedExam : e));
        localStorage.setItem('LUMEN_EXAMS', JSON.stringify(updated));
        return updated;
      });
    }

    setNewQText('');
    setNewQOptA('');
    setNewQOptB('');
    setNewQOptC('');
    setNewQOptD('');
    setIsManualQuestionModalOpen(false);
  };

  // Create Question (generic)
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: newQText,
          optionA: newQOptA,
          optionB: newQOptB,
          optionC: newQOptC,
          optionD: newQOptD,
          correctOption: newQCorrect,
          topic: newQTopic,
        }),
      });
      if (res.ok) {
        setNewQText('');
        setNewQOptA('');
        setNewQOptB('');
        setNewQOptC('');
        setNewQOptD('');
        fetchQuestions();
      }
    } catch {}
  };

  const totalExams = exams.length;
  const publishedCount = exams.filter((e) => e.status === 'published').length;
  const totalResponses = reportRows.length;
  let avgPct = 0;
  if (reportRows.length > 0) {
    const sum = reportRows.reduce((acc, r) => acc + (r.percentage || 0), 0);
    avgPct = Math.round(sum / reportRows.length);
  }

  return (
    <div className="relative min-h-[calc(100vh-2rem)] p-4 sm:p-6 lg:p-8">
      {/* Exact ambient orbs matching screenshots */}
      <div className="lumen-ambient-bg">
        <div className="lumen-orb-left" />
        <div className="lumen-orb-right" />
        <div className="lumen-orb-center" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        
        {/* Top Header matching IMG-20261101-WA0022_38374080.jpg */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
          <div className="flex items-center space-x-2.5 shrink-0">
            <div className="w-7 h-7 rounded-full bg-white border border-slate-200/90 flex items-center justify-center shadow-xs shrink-0">
              <div className="w-3.5 h-3.5 rounded-full bg-[#5d5fef]" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 tracking-tight leading-none whitespace-nowrap">Lumen</div>
              <div className="text-[9px] font-bold text-slate-400 tracking-widest mt-0.5 whitespace-nowrap">EXAMS</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setAdminView('testsuite')}
              className="inline-flex items-center space-x-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="whitespace-nowrap">SRS Tests</span>
            </button>

            <button
              onClick={onSignOut}
              className="rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="whitespace-nowrap">Sign out</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: OVERVIEW SCREEN matching IMG-20261101-WA0022_38374080.jpg */}
        {adminView === 'overview' && (
          <div>
            {/* Signed in as & New exam header */}
            <div className="flex items-end justify-between mb-6 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  SIGNED IN AS
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {user.fullName.split(' ')[0] || 'Vikas'}
                </h1>
              </div>

              <button
                onClick={() => {
                  const newExamId = 'exam-' + Date.now();
                  const newEx: Exam = {
                    id: newExamId,
                    title: 'New Assessment',
                    instructions: 'Answer all multiple-choice questions.',
                    durationMinutes: 30,
                    passingScore: 0,
                    maxAttempts: 1,
                    allowedTabSwitches: 1,
                    showResultAfterSubmission: true,
                    autoSubmitOnTabLimit: false,
                    questionIds: ['q-1', 'q-2'],
                    status: 'published',
                  };
                  fetch('/api/exams', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(newEx),
                  }).then(() => fetchExams());
                }}
                className="rounded-full px-5 py-2 text-xs font-bold text-white bg-[#5d5fef] hover:bg-[#4d4fdf] shadow-md shadow-[#5d5fef]/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                New exam
              </button>
            </div>

            {/* OVERVIEW Card matching screenshot */}
            <div className="bg-white rounded-[28px] p-6 sm:p-7 shadow-[0_10px_35px_rgba(93,95,239,0.06)] border border-slate-100 mb-8">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-5">
                OVERVIEW
              </span>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    TOTAL EXAMS
                  </span>
                  <div className="text-3xl font-black text-slate-900">{totalExams}</div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    PUBLISHED
                  </span>
                  <div className="text-3xl font-black text-slate-900">{publishedCount}</div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    RESPONSES
                  </span>
                  <div className="text-3xl font-black text-slate-900">{totalResponses}</div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    AVERAGE SCORE
                  </span>
                  <div className="text-3xl font-black text-slate-900">{avgPct}%</div>
                </div>
              </div>
            </div>

            {/* Your exams section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-sm font-bold text-slate-900">Your exams</h2>
                <span className="text-xs text-slate-400 font-semibold">{exams.length} total</span>
              </div>

              {exams.length === 0 ? (
                <div className="bg-white rounded-[24px] p-6 text-center border border-slate-100 shadow-2xs text-xs text-slate-500">
                  No exams yet. Create your first one and add questions manually or with AI.
                </div>
              ) : (
                <div className="space-y-3">
                  {exams.map((ex) => (
                    <div
                      key={ex.id}
                      className="bg-white rounded-[24px] p-5 shadow-2xs border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-200 transition-all"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-black text-slate-900">{ex.title}</h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              ex.status === 'published'
                                ? 'bg-[#e6f8f0] text-[#00b87c]'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {ex.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {ex.durationMinutes} minutes &bull; {ex.questionIds.length} questions
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
                        {/* Copy Link for Student */}
                        <button
                          onClick={() => copyExamLink(ex.id)}
                          className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-[#f8faff] hover:bg-slate-100 border border-slate-200 transition-colors inline-flex items-center space-x-1 whitespace-nowrap shrink-0 cursor-pointer"
                          title="Copy direct exam link for candidates"
                        >
                          {copiedExamId === ex.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="text-emerald-700 whitespace-nowrap">Link Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="whitespace-nowrap">Copy Link</span>
                            </>
                          )}
                        </button>

                        {/* Test as candidate */}
                        {onOpenExamAsCandidate && (
                          <button
                            onClick={() => onOpenExamAsCandidate(ex.id)}
                            className="rounded-full px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            title="Open exam as student to take it"
                          >
                            Take Exam
                          </button>
                        )}

                        {/* Questions for this specific exam */}
                        <button
                          onClick={() => {
                            setActiveExam(ex);
                            setAdminView('questions');
                          }}
                          className="rounded-full px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors whitespace-nowrap shrink-0 inline-flex items-center space-x-1 cursor-pointer"
                          title="Manage questions for this exam"
                        >
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span className="whitespace-nowrap">Questions ({ex.questionIds.length})</span>
                        </button>

                        {/* Responses view */}
                        <button
                          onClick={() => {
                            setActiveExam(ex);
                            setAdminView('responses');
                          }}
                          className="rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Responses
                        </button>

                        {/* Settings view */}
                        <button
                          onClick={() => {
                            setActiveExam(ex);
                            setAdminView('settings');
                          }}
                          className="rounded-full px-3.5 py-1.5 text-xs font-bold text-white bg-[#5d5fef] hover:bg-[#4d4fdf] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Settings
                        </button>

                        {/* Delete Exam Button */}
                        <button
                          type="button"
                          onClick={() => setExamToDelete(ex)}
                          className="w-8 h-8 rounded-full border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                          title="Delete this exam"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: RESPONSES SCREEN matching IMG-20261101-WA0025_b4e150fb.jpg */}
        {adminView === 'responses' && activeExam && (
          <div>
            {/* Top Back & Published Pill Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setAdminView('overview')}
                className="rounded-full px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span className="whitespace-nowrap">Back</span>
              </button>

              <span className="rounded-full px-3 py-1 text-xs font-bold bg-[#e6f8f0] text-[#00b87c] border border-[#a7f3d0] whitespace-nowrap shrink-0">
                Published
              </span>
            </div>

            {/* RESPONSES title & info */}
            <div className="mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                RESPONSES
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {activeExam.title}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {reportRows.length} submissions &bull; {activeExam.questionIds.length} questions
              </p>
            </div>

            {/* Content card */}
            {reportRows.length === 0 ? (
              <div className="bg-white rounded-[28px] p-8 text-center border border-slate-100 shadow-2xs">
                <p className="text-xs text-slate-500 font-medium mb-4">
                  No submissions yet. Share the exam link to start collecting responses.
                </p>
                <button
                  onClick={() => copyExamLink(activeExam.id)}
                  className="rounded-full px-5 py-2.5 text-xs font-bold text-white bg-[#5d5fef] hover:bg-[#4d4fdf] shadow-md shadow-[#5d5fef]/20 transition-all inline-flex items-center space-x-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedExamId === activeExam.id ? (
                    <>
                      <Check className="w-4 h-4 text-white shrink-0" />
                      <span className="whitespace-nowrap">Exam Link Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white shrink-0" />
                      <span className="whitespace-nowrap">Copy Exam Link for Candidates</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-[28px] border border-slate-100 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Student Attempts & Audit</span>
                  <a
                    href={`/api/admin/reports/${activeExam.id}/export.csv?token=${token}`}
                    download
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center space-x-1 whitespace-nowrap shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">Export CSV</span>
                  </a>
                </div>

                <div className="overflow-x-auto min-w-full">
                  <table className="w-full text-left text-xs min-w-[540px]">
                    <thead className="bg-[#f8faff] text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 whitespace-nowrap">Candidate</th>
                        <th className="px-4 py-3 whitespace-nowrap">Score</th>
                        <th className="px-4 py-3 whitespace-nowrap">Percentage</th>
                        <th className="px-4 py-3 whitespace-nowrap">Tab Departures</th>
                        <th className="px-4 py-3 text-right whitespace-nowrap">Audit Log</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportRows.map((r) => (
                        <tr key={r.attemptId} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">{r.studentName}</td>
                          <td className="px-4 py-3.5 text-slate-600 font-medium whitespace-nowrap">
                            {r.score} / {r.totalQuestions}
                          </td>
                          <td className="px-4 py-3.5 font-black text-slate-900 whitespace-nowrap">{r.percentage}%</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${
                                r.violationsCount === 0
                                  ? 'bg-[#e6f8f0] text-[#00b87c]'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {r.violationsCount} switches
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedAuditRow(r)}
                              className="rounded-full px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <span className="whitespace-nowrap">View Log</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: EXAM SETTINGS SCREEN matching IMG-20261101-WA0024_e0c5788d.jpg */}
        {adminView === 'settings' && activeExam && (
          <div>
            {/* Top Back, Published & Unpublish Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setAdminView('overview')}
                className="rounded-full px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span className="whitespace-nowrap">Back</span>
              </button>

              <div className="flex items-center space-x-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap shrink-0 ${
                    activeExam.status === 'published'
                      ? 'bg-[#e6f8f0] text-[#00b87c] border border-[#a7f3d0]'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {activeExam.status === 'published' ? 'Published' : 'Draft'}
                </span>

                <button
                  onClick={handleTogglePublish}
                  className="rounded-full px-4 py-1 text-xs font-bold text-white bg-[#5d5fef] hover:bg-[#4d4fdf] transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span className="whitespace-nowrap">{activeExam.status === 'published' ? 'Unpublish' : 'Publish'}</span>
                </button>
              </div>
            </div>

            {/* EXAM Title */}
            <div className="mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                EXAM
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {activeExam.title}
              </h1>
            </div>

            {/* SETTINGS Card matching Figure 4 */}
            <div className="bg-white rounded-[28px] p-6 sm:p-9 shadow-[0_10px_35px_rgba(93,95,239,0.06)] border border-slate-100 space-y-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                SETTINGS
              </span>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Title</label>
                <input
                  type="text"
                  value={settingsTitle}
                  onChange={(e) => setSettingsTitle(e.target.value)}
                  className="w-full text-sm font-black text-slate-900 border-b border-slate-200 pb-1 focus:border-[#5d5fef] focus:outline-none bg-transparent"
                />
              </div>

              {/* Instructions */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">INSTRUCTIONS</label>
                <textarea
                  rows={2}
                  value={settingsInstructions}
                  onChange={(e) => setSettingsInstructions(e.target.value)}
                  className="w-full text-xs font-medium text-slate-800 border-b border-slate-200 pb-1 focus:border-[#5d5fef] focus:outline-none bg-transparent"
                />
              </div>

              {/* Duration */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100 gap-3">
                <span className="text-xs font-medium text-slate-700">Duration (minutes)</span>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={settingsDuration}
                  onChange={(e) => setSettingsDuration(parseInt(e.target.value) || 30)}
                  className="w-16 text-right text-xs font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-1 shrink-0"
                />
              </div>

              {/* Passing score */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100 gap-3">
                <span className="text-xs font-medium text-slate-700">Passing score (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settingsPassingScore}
                  onChange={(e) => setSettingsPassingScore(parseInt(e.target.value) || 0)}
                  className="w-16 text-right text-xs font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-1 shrink-0"
                />
              </div>

              {/* Maximum attempts */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100 gap-3">
                <span className="text-xs font-medium text-slate-700">Maximum attempts</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={settingsMaxAttempts}
                  onChange={(e) => setSettingsMaxAttempts(parseInt(e.target.value) || 1)}
                  className="w-16 text-right text-xs font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-1 shrink-0"
                />
              </div>

              {/* Allowed tab switches */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100 gap-3">
                <span className="text-xs font-medium text-slate-700">Allowed tab switches</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={settingsAllowedTabSwitches}
                  onChange={(e) => setSettingsAllowedTabSwitches(parseInt(e.target.value) || 1)}
                  className="w-16 text-right text-xs font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-1 shrink-0"
                />
              </div>

              {/* Show result after submission toggle */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100 gap-3">
                <span className="text-xs font-medium text-slate-700 pr-2">Show result after submission</span>
                <button
                  type="button"
                  onClick={() => setSettingsShowResult(!settingsShowResult)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                    settingsShowResult ? 'bg-[#5d5fef]' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settingsShowResult ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Auto-submit when tab-switch limit is exceeded toggle */}
              <div className="flex items-center justify-between py-2 gap-3">
                <span className="text-xs font-medium text-slate-700 pr-2">
                  Auto-submit when tab-switch limit is exceeded
                </span>
                <button
                  type="button"
                  onClick={() => setSettingsAutoSubmitOnTabLimit(!settingsAutoSubmitOnTabLimit)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                    settingsAutoSubmitOnTabLimit ? 'bg-[#5d5fef]' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settingsAutoSubmitOnTabLimit ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Exam Questions Row */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100 gap-3">
                <div>
                  <span className="text-xs font-medium text-slate-700 block">Exam Questions</span>
                  <span className="text-[11px] text-slate-400">
                    {activeExam.questionIds.length} {activeExam.questionIds.length === 1 ? 'question' : 'questions'} configured
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAdminView('questions')}
                  className="rounded-full px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center space-x-1"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>Manage Questions ({activeExam.questionIds.length}) &rarr;</span>
                </button>
              </div>

              {/* Direct shareable candidate link */}
              <div className="p-4 rounded-2xl bg-[#f8faff] border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Candidate Exam Link
                  </span>
                  <p className="text-xs font-mono text-slate-600 break-all select-all">
                    {window.location.origin}/?exam={activeExam.id}
                  </p>
                </div>
                <button
                  onClick={() => copyExamLink(activeExam.id)}
                  className="rounded-full px-4 py-2 text-xs font-bold text-white bg-[#5d5fef] hover:bg-[#4d4fdf] transition-all inline-flex items-center justify-center space-x-1.5 whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  {copiedExamId === activeExam.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span className="whitespace-nowrap">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 shrink-0" />
                      <span className="whitespace-nowrap">Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {settingsSavedNotice ? (
                  <span className="text-xs font-bold text-emerald-600">Settings saved successfully!</span>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="rounded-full px-6 py-2.5 text-xs font-bold text-white bg-[#5d5fef] hover:bg-[#4d4fdf] shadow-md shadow-[#5d5fef]/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span className="whitespace-nowrap">Save Settings</span>
                </button>
              </div>

              {/* Danger Zone: Delete this Exam */}
              <div className="mt-8 pt-6 border-t border-rose-100">
                <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider mb-0.5">Danger Zone</h4>
                    <p className="text-xs text-rose-700 leading-relaxed">
                      Permanently delete <span className="font-bold">"{activeExam.title}"</span>. All candidate responses and direct links will be removed.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExamToDelete(activeExam)}
                    className="rounded-full px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all inline-flex items-center justify-center space-x-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">Delete Exam</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 4: EXAM SPECIFIC QUESTIONS MANAGER */}
        {adminView === 'questions' && (
          <div>
            {!activeExam ? (
              <div className="bg-white rounded-[28px] p-8 text-center border border-slate-100">
                <p className="text-xs text-slate-500 mb-3">No exam selected.</p>
                <button
                  onClick={() => setAdminView('overview')}
                  className="rounded-full px-4 py-1.5 text-xs font-bold text-white bg-[#5d5fef]"
                >
                  Return to Overview
                </button>
              </div>
            ) : (
              <div>
                {/* Top Back & Action buttons Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <button
                    onClick={() => setAdminView('overview')}
                    className="rounded-full px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span className="whitespace-nowrap">&larr; Back</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setIsAiModalOpen(true)}
                      className="rounded-full px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#5d5fef] to-[#6c5ce7] hover:opacity-95 shadow-md shadow-[#5d5fef]/20 transition-all inline-flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span className="whitespace-nowrap">✨ AI Generate for this Exam</span>
                    </button>

                    <button
                      onClick={() => setIsManualQuestionModalOpen(true)}
                      className="rounded-full px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs inline-flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span className="whitespace-nowrap">Add Question</span>
                    </button>
                  </div>
                </div>

                {/* Exam Questions Title & Subtitle */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      EXAM QUESTIONS
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        activeExam.status === 'published'
                          ? 'bg-[#e6f8f0] text-[#00b87c]'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {activeExam.status}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {activeExam.title}
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeExam.questionIds.length} {activeExam.questionIds.length === 1 ? 'question' : 'questions'} configured in this assessment &bull; {activeExam.durationMinutes} min
                  </p>
                </div>

                {/* Questions List */}
                {activeExam.questionIds.length === 0 ? (
                  <div className="bg-white rounded-[28px] p-8 text-center border border-slate-100 shadow-2xs">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5d5fef] flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">No questions in this exam yet</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
                      Generate high-quality multiple choice questions automatically with Gemini AI or add your own questions.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setIsAiModalOpen(true)}
                        className="rounded-full px-5 py-2 text-xs font-bold text-white bg-[#5d5fef] hover:bg-[#4d4fdf] shadow-md shadow-[#5d5fef]/20 transition-all inline-flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Generate Questions</span>
                      </button>
                      <button
                        onClick={() => setIsManualQuestionModalOpen(true)}
                        className="rounded-full px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Add Manually
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeExam.questionIds.map((qid, idx) => {
                      const q = questions.find((item) => item.id === qid);
                      if (!q) return null;
                      return (
                        <div
                          key={q.id}
                          className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-2xs hover:border-slate-200 transition-all"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                Question {idx + 1}
                              </span>
                              {q.topic && (
                                <span className="text-[10px] font-medium text-slate-400">
                                  {q.topic}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveQuestionFromExam(activeExam.id, q.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-rose-50 cursor-pointer shrink-0"
                              title="Remove from this exam"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <p className="text-xs sm:text-sm font-bold text-slate-900 mb-3 leading-relaxed">
                            {q.text}
                          </p>

                          {/* Options Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {[
                              { label: 'A', text: q.optionA, idx: 0 },
                              { label: 'B', text: q.optionB, idx: 1 },
                              { label: 'C', text: q.optionC, idx: 2 },
                              { label: 'D', text: q.optionD, idx: 3 },
                            ].map((opt) => (
                              <div
                                key={opt.label}
                                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                                  q.correctOption === opt.idx
                                    ? 'bg-[#e6f8f0] border-[#a7f3d0] text-[#00875a] font-bold'
                                    : 'bg-[#f8faff] border-slate-100 text-slate-600'
                                }`}
                              >
                                <div className="flex items-center space-x-2 min-w-0">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                                    q.correctOption === opt.idx ? 'bg-[#00b87c] text-white' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {opt.label}
                                  </span>
                                  <span className="truncate">{opt.text}</span>
                                </div>
                                {q.correctOption === opt.idx && (
                                  <Check className="w-4 h-4 text-[#00b87c] shrink-0 ml-1" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: SRS CHAPTER 8 TEST SUITE */}
        {adminView === 'testsuite' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setAdminView('overview')}
                className="rounded-full px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span className="whitespace-nowrap">&larr; Back</span>
              </button>
            </div>
            <TestSuiteViewer token={token} />
          </div>
        )}

      </div>

      {/* Gemini AI Modal (Targeted to activeExam) */}
      <GeminiAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        token={token}
        targetExam={activeExam}
        onQuestionsImported={async () => {
          await fetchQuestions();
          await fetchExams();
        }}
      />

      {/* Manual Question Creation Modal for activeExam */}
      {isManualQuestionModalOpen && activeExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Add Question to "{activeExam.title}"
              </h3>
              <button
                type="button"
                onClick={() => setIsManualQuestionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestionForExam} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Question Statement
                </label>
                <textarea
                  required
                  rows={3}
                  value={newQText}
                  onChange={(e) => setNewQText(e.target.value)}
                  placeholder="Enter the question statement..."
                  className="w-full p-3 rounded-2xl bg-[#f8faff] border border-slate-200 focus:bg-white focus:border-[#5d5fef] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Options (select correct one)
                </label>
                <div className="space-y-2">
                  {[
                    { label: 'A', val: newQOptA, set: setNewQOptA, idx: 0 },
                    { label: 'B', val: newQOptB, set: setNewQOptB, idx: 1 },
                    { label: 'C', val: newQOptC, set: setNewQOptC, idx: 2 },
                    { label: 'D', val: newQOptD, set: setNewQOptD, idx: 3 },
                  ].map((opt) => (
                    <div key={opt.label} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`opt-${opt.label}`}
                        name="correctOpt"
                        checked={newQCorrect === opt.idx}
                        onChange={() => setNewQCorrect(opt.idx)}
                        className="cursor-pointer"
                      />
                      <input
                        type="text"
                        required
                        value={opt.val}
                        onChange={(e) => opt.set(e.target.value)}
                        placeholder={`Option ${opt.label}`}
                        className="w-full px-3 py-2 rounded-xl bg-[#f8faff] border border-slate-200 text-xs focus:bg-white focus:border-[#5d5fef] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsManualQuestionModalOpen(false)}
                  className="rounded-full px-4 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full px-5 py-2 font-bold text-white bg-[#5d5fef] hover:bg-[#4d4fdf] shadow-md shadow-[#5d5fef]/20 cursor-pointer"
                >
                  Add Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Exam Confirmation Modal */}
      {examToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              Delete "{examToDelete.title}"?
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to delete this exam? All candidate responses and the shareable exam link will be permanently removed. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setExamToDelete(null)}
                className="rounded-full px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteExam(examToDelete.id)}
                className="rounded-full px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all cursor-pointer inline-flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Exam</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Violation Audit Modal */}
      <ViolationAuditModal
        row={selectedAuditRow}
        onClose={() => setSelectedAuditRow(null)}
      />

    </div>
  );
};
