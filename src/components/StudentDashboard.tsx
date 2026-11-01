import React, { useEffect, useState } from 'react';
import { User, Exam } from '../types';
import { Clock, HelpCircle, ArrowRight, CheckCircle2, AlertTriangle, Shield, Calendar, RefreshCw } from 'lucide-react';

interface StudentExamItem extends Exam {
  isOpen: boolean;
  hasAttempted: boolean;
  attemptStatus: 'in_progress' | 'submitted' | null;
  attemptId: string | null;
  score?: number;
}

interface StudentDashboardProps {
  user: User;
  token: string;
  onStartExam: (examId: string) => void;
  onViewResult: (attemptId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  token,
  onStartExam,
  onViewResult,
}) => {
  const [exams, setExams] = useState<StudentExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExams = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/exams', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load available examinations');
      const data = await res.json();
      setExams(data);
    } catch (err: any) {
      setError(err.message || 'Error loading exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [token]);

  const totalExams = exams.length;
  const publishedCount = exams.filter((e) => e.isOpen).length;
  const attemptedCount = exams.filter((e) => e.hasAttempted && e.attemptStatus === 'submitted').length;
  
  // Calculate average score for completed attempts
  let totalPct = 0;
  let gradedCount = 0;
  exams.forEach((e) => {
    if (e.hasAttempted && e.attemptStatus === 'submitted' && e.questionCount && e.score !== undefined) {
      totalPct += (e.score / e.questionCount) * 100;
      gradedCount++;
    }
  });
  const avgScore = gradedCount > 0 ? Math.round(totalPct / gradedCount) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
      {/* Top Welcome Section matching Figure P.2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-indigo-600 block mb-1">
            LOGGED IN AS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {user.fullName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Department of Computer Science &bull; Student Portal (Sem V)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchExams}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* OVERVIEW Stats Cards matching Figure P.2 exactly */}
      <div className="mb-8">
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          OVERVIEW
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              TOTAL EXAMS
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalExams}</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              PUBLISHED / OPEN
            </span>
            <div className="text-2xl sm:text-3xl font-black text-indigo-600">{publishedCount}</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              RESPONSES / SUBMITTED
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{attemptedCount}</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              AVERAGE SCORE
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">{avgScore}%</div>
          </div>
        </div>
      </div>

      {/* Proctoring Notice Banner */}
      <div className="mb-8 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start space-x-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
          <Shield className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-indigo-950">AI Proctoring & Tab-Switch Verification Active</p>
          <p className="text-indigo-800/90 mt-0.5 leading-relaxed">
            All active exam attempts continuously monitor page visibility via the browser Page Visibility API.
            Switching away from the examination window, opening other browser tabs, or closing the test is server-recorded
            and submitted to the invigilator's consolidated report.
          </p>
        </div>
      </div>

      {/* "Your exams" List matching Figure P.2 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900">Your exams</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {exams.length} total
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500 font-medium">Loading scheduled examinations...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-300">
            <p className="text-sm font-semibold text-slate-700">No exams yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Create your first one and add questions manually or with AI from the admin console.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{exam.title}</h3>
                    {exam.attemptStatus === 'submitted' ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Submitted</span>
                      </span>
                    ) : exam.attemptStatus === 'in_progress' ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0 animate-pulse">
                        <Clock className="w-3 h-3" />
                        <span>In Progress</span>
                      </span>
                    ) : exam.isOpen ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                        Available Now
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 shrink-0">
                        Scheduled
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">{exam.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-5">
                    <span className="flex items-center space-x-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-150">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.durationMinutes} mins</span>
                    </span>
                    <span className="flex items-center space-x-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-150">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.questionCount} Questions</span>
                    </span>
                    <span className="flex items-center space-x-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-150">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Single Attempt (FR-EXAM-06)</span>
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {exam.attemptStatus === 'submitted' ? (
                    <>
                      <div className="text-xs">
                        <span className="text-slate-400 font-medium">Your Score: </span>
                        <span className="font-bold text-emerald-600 text-sm">
                          {exam.score} / {exam.questionCount} marks
                        </span>
                      </div>
                      <button
                        onClick={() => exam.attemptId && onViewResult(exam.attemptId)}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                      >
                        <span>View Result</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : exam.attemptStatus === 'in_progress' ? (
                    <button
                      onClick={() => onStartExam(exam.id)}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <span>Resume Active Attempt</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onStartExam(exam.id)}
                      disabled={!exam.isOpen}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs shadow-indigo-600/20"
                    >
                      <span>{exam.isOpen ? 'Start Examination' : 'Outside Window'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
