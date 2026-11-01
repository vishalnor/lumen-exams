import React, { useState, useEffect } from 'react';
import { User, Exam, Question, ConsolidatedReportRow } from '../types';
import {
  BarChart3,
  BookOpen,
  FileSpreadsheet,
  Plus,
  Users,
  ShieldAlert,
  Download,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Terminal,
  Cpu,
} from 'lucide-react';
import { NvidiaNimModal } from './NvidiaNimModal';
import { ViolationAuditModal } from './ViolationAuditModal';
import { TestSuiteViewer } from './TestSuiteViewer';

interface AdminDashboardProps {
  user: User;
  token: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, token }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'reports' | 'questions' | 'create-exam' | 'students' | 'testsuite'
  >('overview');

  // Overview stats
  const [overview, setOverview] = useState<{
    totalExams: number;
    publishedExams: number;
    activeAttempts: number;
    submittedAttempts: number;
    totalResponses: number;
    averageScore: number;
  }>({
    totalExams: 0,
    publishedExams: 0,
    activeAttempts: 0,
    submittedAttempts: 0,
    totalResponses: 0,
    averageScore: 0,
  });

  // Exams, Questions, Reports, Students
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('exam-cyber');
  const [reportRows, setReportRows] = useState<ConsolidatedReportRow[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isNimModalOpen, setIsNimModalOpen] = useState(false);
  const [selectedAuditRow, setSelectedAuditRow] = useState<ConsolidatedReportRow | null>(null);

  // Question Creation Form State
  const [newQText, setNewQText] = useState('');
  const [newQOptA, setNewQOptA] = useState('');
  const [newQOptB, setNewQOptB] = useState('');
  const [newQOptC, setNewQOptC] = useState('');
  const [newQOptD, setNewQOptD] = useState('');
  const [newQCorrect, setNewQCorrect] = useState<number>(0);
  const [newQTopic, setNewQTopic] = useState('Cyber Security');
  const [qSearch, setQSearch] = useState('');
  const [qTopicFilter, setQTopicFilter] = useState('all');

  // Exam Configuration Form State
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamDesc, setNewExamDesc] = useState('');
  const [newExamDuration, setNewExamDuration] = useState(30);
  const [newExamSelectedQuestions, setNewExamSelectedQuestions] = useState<string[]>([]);
  const [examFormError, setExamFormError] = useState<string | null>(null);
  const [examFormSuccess, setExamFormSuccess] = useState<string | null>(null);

  // Initial Fetch
  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch {}
  };

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExams(data);
        if (data.length > 0 && !selectedExamId) {
          setSelectedExamId(data[0].id);
        }
      }
    } catch {}
  };

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

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/admin/students', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchOverview();
    fetchExams();
    fetchQuestions();
    fetchStudents();
  }, [token]);

  useEffect(() => {
    if (selectedExamId && (activeTab === 'reports' || activeTab === 'overview')) {
      fetchReport(selectedExamId);
    }
  }, [selectedExamId, activeTab]);

  // Handle Question Creation (FR-QB-01)
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save question');
      }

      setNewQText('');
      setNewQOptA('');
      setNewQOptB('');
      setNewQOptC('');
      setNewQOptD('');
      setNewQCorrect(0);
      fetchQuestions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle Delete Question (FR-QB-02)
  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Are you sure you want to remove this question?')) return;
    try {
      const res = await fetch(`/api/questions/${qId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Could not delete question');
      } else {
        fetchQuestions();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Create Exam (FR-QB-03)
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setExamFormError(null);
    setExamFormSuccess(null);

    if (newExamSelectedQuestions.length === 0) {
      setExamFormError('Please select at least one question from the question bank (FR-QB-03)');
      return;
    }

    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newExamTitle,
          description: newExamDesc,
          durationMinutes: newExamDuration,
          questionIds: newExamSelectedQuestions,
          availableFrom: new Date(Date.now() - 3600 * 1000).toISOString(),
          availableTo: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to configure exam');
      }

      setExamFormSuccess('Examination configured and published successfully!');
      setNewExamTitle('');
      setNewExamDesc('');
      setNewExamSelectedQuestions([]);
      fetchExams();
      fetchOverview();
    } catch (err: any) {
      setExamFormError(err.message);
    }
  };

  // Direct CSV Export (FR-RES-04)
  const handleExportCSV = () => {
    if (!selectedExamId) return;
    window.open(`/api/admin/reports/${selectedExamId}/export.csv?token=${token}`, '_blank');
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.text.toLowerCase().includes(qSearch.toLowerCase()) ||
      q.topic.toLowerCase().includes(qSearch.toLowerCase());
    const matchesTopic = qTopicFilter === 'all' || q.topic === qTopicFilter;
    return matchesSearch && matchesTopic;
  });

  const uniqueTopics = Array.from(new Set(questions.map((q) => q.topic)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              ADMINISTRATION CONSOLE
            </span>
            <span className="text-xs text-slate-500 font-medium">Lumen Assessment Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Faculty & Proctoring Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Thakur Ramnarayan College &bull; Department of Computer Science (TRCAC)
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsNimModalOpen(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-xs shadow-emerald-600/20 cursor-pointer transition-all"
          >
            <Cpu className="w-4 h-4" />
            <span>Generate Questions (NVIDIA NIM)</span>
          </button>

          <button
            onClick={() => {
              fetchOverview();
              fetchExams();
              fetchQuestions();
              fetchStudents();
              if (selectedExamId) fetchReport(selectedExamId);
            }}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer"
            title="Refresh system state"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-1 border-b border-slate-200/90 mb-8 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Platform Summary', icon: BarChart3 },
          { id: 'reports', label: 'Consolidated Reports & Audit', icon: ShieldAlert },
          { id: 'questions', label: 'Question Bank Manager', icon: BookOpen },
          { id: 'create-exam', label: 'Configure Examination', icon: Plus },
          { id: 'students', label: 'Student Accounts', icon: Users },
          { id: 'testsuite', label: 'SRS Test Suite Runner', icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-b-2 border-indigo-600 text-indigo-700 bg-indigo-50/40'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW TAB matching Figure P.6 & Section 9.1 */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Metrics summary cards */}
          <div>
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              PLATFORM ACTIVITY (FR-ADM-01)
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  CONFIGURED EXAMS
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">{overview.totalExams}</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  PUBLISHED
                </span>
                <div className="text-2xl sm:text-3xl font-black text-indigo-600">{overview.publishedExams}</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  IN PROGRESS
                </span>
                <div className="text-2xl sm:text-3xl font-black text-amber-600">{overview.activeAttempts}</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  RESPONSES / SUBMITTED
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600">{overview.totalResponses}</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  AVERAGE SCORE
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">{overview.averageScore}%</div>
              </div>
            </div>
          </div>

          {/* Published Examination Cards matching Figure P.6 */}
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-3">Active Examinations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {exams.map((ex) => (
                <div
                  key={ex.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        EXAMINATION
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        Published
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1">{ex.title}</h3>
                    <p className="text-xs text-slate-500 mb-4">{ex.description}</p>

                    <div className="flex items-center space-x-3 text-xs text-slate-600 mb-4">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ex.durationMinutes} minutes</span>
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center space-x-1">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ex.questionIds.length} questions</span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Attempts recorded:{' '}
                      <strong className="text-slate-800">
                        {reportRows.filter((r) => r.examId === ex.id).length}
                      </strong>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedExamId(ex.id);
                        setActiveTab('reports');
                      }}
                      className="py-1.5 px-3 rounded-lg text-xs font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 transition-colors cursor-pointer"
                    >
                      View Proctoring Reports &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. CONSOLIDATED REPORTS & PROCTORING AUDIT (FR-RES-03 & FR-RES-04) */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Controls: Exam selection & Export CSV */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                Select Exam:
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} ({ex.durationMinutes} mins)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV (FR-RES-04)</span>
            </button>
          </div>

          {/* Consolidated Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Consolidated Student Score & Tab-Switch Audit (FR-RES-03)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Combines verified scores with server-recorded Page Visibility events
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {reportRows.length} attempts
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-slate-500">Compiling report data...</p>
              </div>
            ) : reportRows.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No submissions yet for this examination. Students can begin attempts from their portal.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Score & Percentage</th>
                      <th className="px-4 py-3">Submission Type</th>
                      <th className="px-4 py-3">Submitted At</th>
                      <th className="px-4 py-3">Tab Violations</th>
                      <th className="px-4 py-3 text-right">Audit Trail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportRows.map((row) => {
                      const riskLevel =
                        row.violationsCount === 0
                          ? 'Clean'
                          : row.violationsCount <= 2
                          ? 'Moderate'
                          : 'High Flagged';
                      const badgeClass =
                        row.violationsCount === 0
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : row.violationsCount <= 2
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200';

                      return (
                        <tr key={row.attemptId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900">{row.studentName}</div>
                            <div className="text-[11px] text-slate-400">{row.studentEmail}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900">
                              {row.score} / {row.totalQuestions}
                            </div>
                            <div className="text-[11px] text-slate-500 font-semibold">
                              {row.percentage}%
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                row.submissionReason === 'auto'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {row.submissionReason === 'auto' ? 'Auto (Time Expiry)' : 'Manual Submit'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                            {row.submittedAt
                              ? new Date(row.submittedAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })
                              : 'In Progress'}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}`}
                            >
                              <span>{row.violationsCount} switches</span>
                              <span>&bull;</span>
                              <span>{riskLevel}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => setSelectedAuditRow(row)}
                              className="py-1.5 px-3 rounded-lg text-xs font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 transition-colors cursor-pointer"
                            >
                              View Audit Log
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. QUESTION BANK MANAGER (FR-QB-01 & FR-QB-02) */}
      {activeTab === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 1/3: Create Question Form */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Add Question to Bank</h3>
              <button
                type="button"
                onClick={() => setIsNimModalOpen(true)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>NVIDIA NIM AI</span>
              </button>
            </div>

            {error && (
              <div className="p-2.5 mb-4 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateQuestion} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Topic / Category</label>
                <input
                  type="text"
                  required
                  value={newQTopic}
                  onChange={(e) => setNewQTopic(e.target.value)}
                  placeholder="e.g. Cyber Security, Web Tech"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Question Text</label>
                <textarea
                  required
                  rows={3}
                  value={newQText}
                  onChange={(e) => setNewQText(e.target.value)}
                  placeholder="Enter the question statement..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">
                  Answer Options & Correct Key (Select Radio)
                </label>

                {[
                  { label: 'A', val: newQOptA, setVal: setNewQOptA, idx: 0 },
                  { label: 'B', val: newQOptB, setVal: setNewQOptB, idx: 1 },
                  { label: 'C', val: newQOptC, setVal: setNewQOptC, idx: 2 },
                  { label: 'D', val: newQOptD, setVal: setNewQOptD, idx: 3 },
                ].map((opt) => (
                  <div key={opt.label} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={newQCorrect === opt.idx}
                      onChange={() => setNewQCorrect(opt.idx)}
                      className="cursor-pointer text-indigo-600 focus:ring-indigo-500"
                      title={`Mark Option ${opt.label} as correct answer`}
                    />
                    <input
                      type="text"
                      required
                      value={opt.val}
                      onChange={(e) => opt.setVal(e.target.value)}
                      placeholder={`Option ${opt.label}`}
                      className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 ${
                        newQCorrect === opt.idx
                          ? 'border-emerald-500 bg-emerald-50/30'
                          : 'border-slate-200'
                      }`}
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full mt-3 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs cursor-pointer transition-all"
              >
                Save to Question Bank
              </button>
            </form>
          </div>

          {/* Right 2/3: Question Bank List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter toolbar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
              <input
                type="text"
                value={qSearch}
                onChange={(e) => setQSearch(e.target.value)}
                placeholder="Search questions or topics..."
                className="w-full sm:w-64 px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none"
              />

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-slate-500">Filter Topic:</span>
                <select
                  value={qTopicFilter}
                  onChange={(e) => setQTopicFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="all">All Topics</option>
                  {uniqueTopics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Questions list */}
            <div className="space-y-3">
              {filteredQuestions.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-xs text-slate-400">
                  No questions match your search. Use the form on the left or generate with NVIDIA NIM AI.
                </div>
              ) : (
                filteredQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-indigo-200 transition-colors text-xs"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-slate-400 font-bold">#{idx + 1}</span>
                        <span className="font-semibold text-slate-900 leading-snug">{q.text}</span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[10px]">
                          {q.topic}
                        </span>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                          title="Delete question (FR-QB-02)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
                      <div
                        className={`p-1.5 rounded-lg border ${
                          q.correctOption === 0
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold'
                            : 'border-slate-100 text-slate-600'
                        }`}
                      >
                        A: {q.optionA} {q.correctOption === 0 && '✓ (Correct)'}
                      </div>
                      <div
                        className={`p-1.5 rounded-lg border ${
                          q.correctOption === 1
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold'
                            : 'border-slate-100 text-slate-600'
                        }`}
                      >
                        B: {q.optionB} {q.correctOption === 1 && '✓ (Correct)'}
                      </div>
                      <div
                        className={`p-1.5 rounded-lg border ${
                          q.correctOption === 2
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold'
                            : 'border-slate-100 text-slate-600'
                        }`}
                      >
                        C: {q.optionC} {q.correctOption === 2 && '✓ (Correct)'}
                      </div>
                      <div
                        className={`p-1.5 rounded-lg border ${
                          q.correctOption === 3
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold'
                            : 'border-slate-100 text-slate-600'
                        }`}
                      >
                        D: {q.optionD} {q.correctOption === 3 && '✓ (Correct)'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. CONFIGURE EXAMINATION (FR-QB-03) */}
      {activeTab === 'create-exam' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Create & Configure Examination</h2>
          <p className="text-xs text-slate-500 mb-6">
            Set duration (5 to 180 min), title, and select items from question bank per FR-QB-03.
          </p>

          {examFormError && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {examFormError}
            </div>
          )}

          {examFormSuccess && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              {examFormSuccess}
            </div>
          )}

          <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Examination Title</label>
              <input
                type="text"
                required
                value={newExamTitle}
                onChange={(e) => setNewExamTitle(e.target.value)}
                placeholder="e.g. Distributed Systems & Cloud Security"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description / Instructions</label>
              <textarea
                rows={2}
                value={newExamDesc}
                onChange={(e) => setNewExamDesc(e.target.value)}
                placeholder="Instructions for students regarding timing and proctoring rules..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Duration (Minutes) &bull; Range: 5 to 180 min
              </label>
              <input
                type="number"
                min={5}
                max={180}
                required
                value={newExamDuration}
                onChange={(e) => setNewExamDuration(parseInt(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none"
              />
            </div>

            {/* Select Questions from Bank */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-slate-700">
                  Select Questions from Bank ({newExamSelectedQuestions.length} selected)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setNewExamSelectedQuestions(
                      newExamSelectedQuestions.length === questions.length ? [] : questions.map((q) => q.id)
                    )
                  }
                  className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  {newExamSelectedQuestions.length === questions.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/40">
                {questions.map((q) => {
                  const isChecked = newExamSelectedQuestions.includes(q.id);
                  return (
                    <label
                      key={q.id}
                      className={`flex items-start space-x-2.5 p-2 rounded-lg cursor-pointer border transition-colors ${
                        isChecked ? 'bg-indigo-50/70 border-indigo-200' : 'bg-white border-slate-200/80'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewExamSelectedQuestions([...newExamSelectedQuestions, q.id]);
                          } else {
                            setNewExamSelectedQuestions(
                              newExamSelectedQuestions.filter((id) => id !== q.id)
                            );
                          }
                        }}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{q.text}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{q.topic}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
            >
              Publish Examination
            </button>
          </form>
        </div>
      )}

      {/* 5. STUDENT ACCOUNTS (FR-ADM-02) */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Student Accounts & History (FR-ADM-02)
            </h3>
            <span className="text-xs text-slate-500">{students.length} Registered Candidates</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Attempts Count</th>
                  <th className="px-4 py-3">Tab Violations Flagged</th>
                  <th className="px-4 py-3">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{s.fullName}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{s.email}</td>
                    <td className="px-4 py-3 text-slate-700 font-semibold">{s.attemptsCount} attempts</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          s.totalViolations === 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {s.totalViolations} events
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SRS TEST SUITE RUNNER (Chapter 8) */}
      {activeTab === 'testsuite' && <TestSuiteViewer token={token} />}

      {/* Modals */}
      <NvidiaNimModal
        isOpen={isNimModalOpen}
        onClose={() => setIsNimModalOpen(false)}
        token={token}
        onQuestionsImported={() => {
          fetchQuestions();
        }}
      />

      <ViolationAuditModal
        row={selectedAuditRow}
        onClose={() => setSelectedAuditRow(null)}
      />

    </div>
  );
};
