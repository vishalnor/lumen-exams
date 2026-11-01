import React, { useState } from 'react';
import { ArrowRight, Clock, HelpCircle, Shield, AlertCircle } from 'lucide-react';

interface CandidateStartScreenProps {
  examId: string;
  examTitle: string;
  durationMinutes: number;
  questionCount: number;
  instructions?: string;
  onStart: (candidateName: string) => Promise<void>;
  loading: boolean;
  onGoToConsole?: () => void;
}

export const CandidateStartScreen: React.FC<CandidateStartScreenProps> = ({
  examTitle,
  durationMinutes,
  questionCount,
  instructions = 'Answer all multiple-choice questions.',
  onStart,
  loading,
  onGoToConsole,
}) => {
  const [candidateName, setCandidateName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) {
      setError('Please enter your full name to proceed with the exam.');
      return;
    }
    setError(null);
    await onStart(candidateName.trim());
  };

  return (
    <div className="relative min-h-[calc(100vh-2rem)] flex items-center justify-center p-4">
      {/* Exact ambient orbs matching screenshots */}
      <div className="lumen-ambient-bg">
        <div className="lumen-orb-left" />
        <div className="lumen-orb-right" />
        <div className="lumen-orb-center" />
      </div>

      <div className="relative z-10 w-full max-w-md">
          {/* Card matching Lumen style */}
        <div className="bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-9 shadow-[0_10px_35px_rgba(93,95,239,0.06)] border border-slate-100">
          
          {/* Logo with purple circle dot */}
          <div className="flex items-center space-x-2.5 mb-6">
            <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs shrink-0">
              <div className="w-3.5 h-3.5 rounded-full bg-[#5d5fef]" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 tracking-tight leading-none whitespace-nowrap">Lumen</div>
              <div className="text-[9px] font-bold text-slate-400 tracking-widest mt-0.5 whitespace-nowrap">EXAMS</div>
            </div>
          </div>

          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">
            EXAMINATION PORTAL
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            {examTitle}
          </h1>

          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            {instructions}
          </p>

          {/* Exam specs pill tags */}
          <div className="flex flex-wrap items-center gap-2 mb-6 text-xs text-slate-600">
            <span className="px-3 py-1.5 rounded-full bg-[#f8faff] border border-slate-100 flex items-center space-x-1.5 font-medium whitespace-nowrap shrink-0">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="whitespace-nowrap">{durationMinutes} minutes</span>
            </span>
            <span className="px-3 py-1.5 rounded-full bg-[#f8faff] border border-slate-100 flex items-center space-x-1.5 font-medium whitespace-nowrap shrink-0">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="whitespace-nowrap">{questionCount} questions</span>
            </span>
          </div>

          {/* Proctoring notice */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 mb-6 text-xs text-indigo-900 flex items-start space-x-2.5">
            <Shield className="w-4 h-4 text-[#5d5fef] shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Lightweight Proctoring Active:</strong> Tab departures, window switches, and page visibility are recorded automatically.
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* User only enters Name (No login required) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Your Full Name
              </label>
              <input
                type="text"
                required
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. Vikas Chaurasiya"
                className="w-full px-5 py-3.5 rounded-full bg-[#f8faff] text-xs font-medium border border-transparent focus:bg-white focus:border-[#5d5fef] focus:outline-none transition-all placeholder:text-slate-400 shadow-2xs"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-3.5 px-6 text-xs font-bold text-white bg-gradient-to-r from-[#5d5fef] to-[#6c5ce7] hover:opacity-95 shadow-md shadow-[#5d5fef]/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <>
                  <span className="whitespace-nowrap">Start Examination</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>
          </form>

          {onGoToConsole && (
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={onGoToConsole}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap cursor-pointer inline-flex items-center space-x-1"
              >
                <span className="whitespace-nowrap">Administrator Console</span>
                <span className="shrink-0">&rarr;</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
