import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft } from 'lucide-react';

interface ResultScreenProps {
  attemptId: string;
  onBackToHome: () => void;
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
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  attemptId,
  onBackToHome,
}) => {
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await fetch(`/api/attempts/${attemptId}/result`);
        if (res.ok) {
          const data = await res.json();
          setResult(data);
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.5 },
            });
          } catch {}
        }
      } catch {} finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="relative min-h-[calc(100vh-2rem)] flex items-center justify-center p-4">
        <div className="lumen-ambient-bg">
          <div className="lumen-orb-left" />
          <div className="lumen-orb-right" />
        </div>
        <div className="relative z-10 bg-white rounded-[32px] p-8 max-w-sm w-full text-center border border-slate-100 shadow-sm">
          <div className="w-8 h-8 border-3 border-[#5d5fef] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-semibold">Calculating exam score...</p>
        </div>
      </div>
    );
  }

  const studentName = result?.studentName?.toLowerCase() || 'vikas';
  const percentage = result?.percentage ?? 0;
  const score = result?.score ?? 0;
  const total = result?.totalQuestions ?? 3;

  return (
    <div className="relative min-h-[calc(100vh-2rem)] flex items-center justify-center p-4">
      {/* Exact ambient orbs matching screenshots */}
      <div className="lumen-ambient-bg">
        <div className="lumen-orb-left" />
        <div className="lumen-orb-right" />
        <div className="lumen-orb-center" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card matching IMG-20261101-WA0028_58e7c4c1.jpg exactly */}
        <div className="bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-10 shadow-[0_10px_35px_rgba(93,95,239,0.06)] border border-slate-100">
          
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1 whitespace-nowrap">
            SUBMITTED
          </span>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-3 capitalize">
            Thanks, {studentName}
          </h1>

          <div className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight mb-1 whitespace-nowrap">
            {percentage}%
          </div>

          <p className="text-xs text-slate-500 font-medium whitespace-nowrap">
            {score} of {total} marks
          </p>

          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={onBackToHome}
              className="rounded-full py-2.5 px-5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors inline-flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Back to home</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
