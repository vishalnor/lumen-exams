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

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
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

  // Fetch Exams
  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExams(data);
        if (data.length > 0 && !activeExam) {
          setActiveExam(data[0]);
        }
      }
    } catch {}
  };

  // Fetch Questions
  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/questions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch {}
  };

  // Fetch Reports for active exam
  const fetchReport = async (examId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${examId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
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

  // Create Question
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
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center space-x-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">AI Generator</span>
            </button>

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
                          className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-[#f8faff] hover:bg-slate-100 border border-slate-200 transition-colors inline-flex items-center space-x-1 whitespace-nowrap shrink-0"
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
                            className="rounded-full px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors whitespace-nowrap shrink-0"
                            title="Open exam as student to take it"
                          >
                            Take Exam
                          </button>
                        )}

                        {/* Responses view */}
                        <button
                          onClick={() => {
                            setActiveExam(ex);
                            setAdminView('responses');
                          }}
                          className="rounded-full px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                        >
                          Responses
                        </button>

                        {/* Settings view */}
                        <button
                          onClick={() => {
                            setActiveExam(ex);
                            setAdminView('settings');
                          }}
                          className="rounded-full px-4 py-1.5 text-xs font-bold text-white bg-[#5d5fef] hover:bg-[#4d4fdf] transition-colors whitespace-nowrap shrink-0"
                        >
                          Settings
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Question Bank & AI generation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[24px] bg-white border border-slate-100 shadow-2xs gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Question Bank & AI Generator</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Generate multiple-choice items automatically with AI or manage items manually.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsAiModalOpen(true)}
                  className="rounded-full px-4 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span className="whitespace-nowrap">AI Generator</span>
                </button>
                <button
                  onClick={() => setAdminView('questions')}
                  className="rounded-full px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span className="whitespace-nowrap">Manage Bank ({questions.length})</span>
                </button>
              </div>
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
            </div>
          </div>
        )}

        {/* VIEW 4: QUESTION BANK MANAGER */}
        {adminView === 'questions' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <button
                onClick={() => setAdminView('overview')}
                className="rounded-full px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span className="whitespace-nowrap">Back</span>
              </button>
              <button
                onClick={() => setIsAiModalOpen(true)}
                className="rounded-full px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#5d5fef] to-[#6c5ce7] hover:opacity-95 transition-all shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span className="whitespace-nowrap">Generate with AI</span>
              </button>
            </div>

            <h1 className="text-xl font-black text-slate-900 mb-4">Question Bank Items</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-2xs h-fit">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
                  Add New Question
                </h3>
                <form onSubmit={handleCreateQuestion} className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Question Text</label>
                    <textarea
                      required
                      rows={3}
                      value={newQText}
                      onChange={(e) => setNewQText(e.target.value)}
                      placeholder="Enter question text..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                    />
                  </div>

                  {[
                    { label: 'A', val: newQOptA, set: setNewQOptA, idx: 0 },
                    { label: 'B', val: newQOptB, set: setNewQOptB, idx: 1 },
                    { label: 'C', val: newQOptC, set: setNewQOptC, idx: 2 },
                    { label: 'D', val: newQOptD, set: setNewQOptD, idx: 3 },
                  ].map((opt) => (
                    <div key={opt.label} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="correct"
                        checked={newQCorrect === opt.idx}
                        onChange={() => setNewQCorrect(opt.idx)}
                      />
                      <input
                        type="text"
                        required
                        value={opt.val}
                        onChange={(e) => opt.set(e.target.value)}
                        placeholder={`Option ${opt.label}`}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                  ))}

                  <button
                    type="submit"
                    className="w-full rounded-full py-2.5 text-xs font-bold text-white bg-[#5d5fef] hover:bg-[#4d4fdf] cursor-pointer whitespace-nowrap"
                  >
                    <span className="whitespace-nowrap">Save Question</span>
                  </button>
                </form>
              </div>

              <div className="md:col-span-2 space-y-3">
                {questions.map((q, idx) => (
                  <div key={q.id} className="bg-white rounded-[24px] p-4 border border-slate-100 shadow-2xs text-xs">
                    <div className="font-bold text-slate-900 mb-2">
                      #{idx + 1}. {q.text}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <span className={q.correctOption === 0 ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
                        A: {q.optionA}
                      </span>
                      <span className={q.correctOption === 1 ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
                        B: {q.optionB}
                      </span>
                      <span className={q.correctOption === 2 ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
                        C: {q.optionC}
                      </span>
                      <span className={q.correctOption === 3 ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
                        D: {q.optionD}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                <span className="whitespace-nowrap">Back</span>
              </button>
            </div>
            <TestSuiteViewer token={token} />
          </div>
        )}

      </div>

      {/* Modals */}
      <GeminiAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        token={token}
        onQuestionsImported={() => fetchQuestions()}
      />

      <ViolationAuditModal
        row={selectedAuditRow}
        onClose={() => setSelectedAuditRow(null)}
      />

    </div>
  );
};
