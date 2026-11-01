import React, { useEffect, useState } from 'react';
import { User } from '../types';
import confetti from 'canvas-confetti';
import { CheckCircle2, Clock, Award, ArrowLeft, Calendar, FileText } from 'lucide-react';

interface ResultScreenProps {
  user: User;
  token: string;
  attemptId: string;
  onBackToDashboard: () => void;
}

interface ResultData {
  attemptId: string;
  examTitle: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  submissionReason: 'manual' | 'auto';
  submittedAt: string;
  startedAt: string;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  user,
  token,
  attemptId,
  onBackToDashboard,
}) => {
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/attempts/${attemptId}/result`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to retrieve scored result');
        const data = await res.json();
        setResult(data);

        // Confetti celebration if passed or completed
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}
      } catch (err: any) {
        setError(err.message || 'Error loading result');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId, token]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center border border-slate-200 shadow-xl">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs text-slate-500 font-medium">Evaluating and calculating final score...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-rose-200 shadow-xl text-center">
          <h2 className="font-bold text-slate-800 text-base mb-2">Error Loading Result</h2>
          <p className="text-xs text-rose-600 mb-6">{error || 'Result record unavailable'}</p>
          <button
            onClick={onBackToDashboard}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(result.submittedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 overflow-hidden">
      {/* Soft ambient background blooms matching Figure P.5 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-200/50 via-purple-200/40 to-blue-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md">
        {/* Card matching Figure P.5 exactly */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 sm:p-9 shadow-xl shadow-indigo-500/5 border border-white/80 ring-1 ring-slate-100">
          
          {/* Green Submitted Tag matching Figure P.5 */}
          <div className="mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SUBMITTED</span>
            </span>
          </div>

          {/* Student Welcome / Thanks */}
          <h2 className="text-xl font-bold text-slate-900 mb-1">
            Thanks, {result.studentName || user.fullName}
          </h2>
          <p className="text-xs text-slate-500 mb-6 font-medium">
            Exam: {result.examTitle}
          </p>

          {/* Big Score Percentage Display matching Figure P.5 */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-200/70 mb-6 text-center">
            <div className="text-5xl font-black text-slate-900 tracking-tight mb-1">
              {result.percentage}%
            </div>
            <div className="text-sm font-semibold text-slate-600">
              {result.score} of {result.totalQuestions} marks
            </div>
          </div>

          {/* Metadata attributes */}
          <div className="space-y-2.5 text-xs text-slate-600 mb-6 pb-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Submission Mode:</span>
              <span className="font-semibold capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {result.submissionReason === 'auto' ? 'Auto (Timer Expiry)' : 'Manual Submission'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Timestamp:</span>
              <span className="font-semibold text-slate-800">{formattedDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-semibold text-emerald-600">Scored by Server (FR-RES-01)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center mb-6 leading-relaxed">
            Your results have been durably preserved in the examination database. An invigilator audit report has been compiled for faculty review.
          </div>

          {/* Button back */}
          <button
            onClick={onBackToDashboard}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-600/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
