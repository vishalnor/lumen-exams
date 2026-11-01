import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Question, ExamAttempt } from '../types';
import { Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ExamInterfaceProps {
  candidateName: string;
  attemptId: string;
  examTitle: string;
  initialQuestions: Question[];
  initialRemainingSeconds: number;
  onSubmitted: (attemptId: string) => void;
  token?: string;
}

export const ExamInterface: React.FC<ExamInterfaceProps> = ({
  candidateName,
  attemptId,
  examTitle,
  initialQuestions,
  initialRemainingSeconds,
  onSubmitted,
  token,
}) => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(initialRemainingSeconds);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tabWarning, setTabWarning] = useState<string | null>(null);

  // References for event listeners
  const attemptIdRef = useRef(attemptId);
  attemptIdRef.current = attemptId;

  // 1. Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          submitExam('auto');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Periodic synchronization with server deadline
    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/attempts/${attemptIdRef.current}`);
        if (res.ok) {
          const data = await res.json();
          if (data.remainingSeconds !== undefined) {
            setRemainingSeconds(data.remainingSeconds);
          }
        }
      } catch {}
    }, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, []);

  // 2. Tab-Switch & Page Visibility Proctoring (Page Visibility API + Beacon API)
  useEffect(() => {
    const reportViolation = (eventType: string, details?: string) => {
      const payload = {
        attemptId: attemptIdRef.current,
        eventType,
        details: details || `Client detected: ${eventType}`,
      };

      fetch('/api/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation('hidden', 'Page Visibility API: Document hidden (tab departure)');
      } else {
        reportViolation('visible', 'Page Visibility API: Document returned to active tab');
        setTabWarning('Notice: Switching tabs or leaving the examination window is recorded.');
        setTimeout(() => setTabWarning(null), 5000);
      }
    };

    const handleBlur = () => {
      reportViolation('blur', 'Window lost focus');
    };

    const handlePageHide = () => {
      if (navigator.sendBeacon) {
        const payload = JSON.stringify({
          attemptId: attemptIdRef.current,
          eventType: 'page_unload',
          details: 'Beacon API: Tab or window closed abruptly',
        });
        navigator.sendBeacon('/api/violations', payload);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  // 3. Option Selection
  const handleSelectOption = async (optionIndex: number) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));

    try {
      await fetch('/api/answers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          attemptId,
          questionId: currentQ.id,
          selectedOption: optionIndex,
        }),
      });
    } catch {}
  };

  // 4. Submit Exam
  const submitExam = useCallback(
    async (reason: 'manual' | 'auto') => {
      if (submitting) return;
      setSubmitting(true);
      setShowConfirmModal(false);

      try {
        const res = await fetch(`/api/attempts/${attemptId}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ reason }),
        });

        if (res.ok) {
          onSubmitted(attemptId);
        } else {
          onSubmitted(attemptId);
        }
      } catch {
        onSubmitted(attemptId);
      }
    },
    [attemptId, onSubmitted, submitting, token]
  );

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const currentQ = questions[currentIndex];
  const optionsList = [
    { label: 'A', text: currentQ?.optionA, index: 0 },
    { label: 'B', text: currentQ?.optionB, index: 1 },
    { label: 'C', text: currentQ?.optionC, index: 2 },
    { label: 'D', text: currentQ?.optionD, index: 3 },
  ];

  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="relative min-h-[calc(100vh-2rem)] flex items-center justify-center p-4">
      {/* Exact ambient orbs matching screenshots */}
      <div className="lumen-ambient-bg">
        <div className="lumen-orb-left" />
        <div className="lumen-orb-right" />
        <div className="lumen-orb-center" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* Warning notification */}
        {tabWarning && (
          <div className="mb-3 p-3 rounded-2xl bg-amber-500 text-white text-xs font-semibold shadow-md flex items-center space-x-2 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{tabWarning}</span>
          </div>
        )}

        {/* Card matching IMG-20261101-WA0026_02969c04.jpg and WA0027 exactly */}
        <div className="bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-9 shadow-[0_10px_35px_rgba(93,95,239,0.06)] border border-slate-100">
          
          {/* Top header row inside card */}
          <div className="flex items-start justify-between mb-4 gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                NOW ANSWERING
              </span>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {examTitle}
              </h1>
            </div>

            <div className="text-right shrink-0">
              <div className="text-sm font-black text-slate-900 leading-none whitespace-nowrap">
                {formattedTime}
              </div>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 whitespace-nowrap">
                left
              </span>
            </div>
          </div>

          {/* Progress dashes and counter */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-1.5">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentIndex
                      ? 'w-4 bg-[#5d5fef]'
                      : selectedAnswers[questions[i]?.id] !== undefined
                      ? 'w-1.5 bg-[#5d5fef]/60'
                      : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            <div className="text-xs font-semibold text-slate-400 whitespace-nowrap">
              {currentIndex + 1} / {questions.length}
            </div>
          </div>

          {/* Question statement */}
          {currentQ && (
            <div className="mb-6">
              <span className="text-[10px] font-bold text-[#5d5fef] uppercase tracking-wider block mb-2">
                QUESTION {currentIndex + 1}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {currentQ.text}
              </h2>
            </div>
          )}

          {/* Options matching screenshot pill style */}
          <div className="space-y-3 mb-6">
            {optionsList.map((opt) => {
              const isSelected = selectedAnswers[currentQ?.id] === opt.index;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => handleSelectOption(opt.index)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-full transition-all flex items-center space-x-3.5 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#5d5fef] to-[#6c5ce7] text-white shadow-md shadow-[#5d5fef]/20 border-transparent'
                      : 'border border-slate-100 bg-[#f8faff] hover:bg-slate-100/70 text-slate-800'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {opt.label}
                  </div>
                  <span className={`text-xs font-medium flex-1 break-words ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Prev and Next Question Buttons matching screenshot */}
          <div className="flex items-center space-x-3 mb-3">
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="rounded-full px-5 py-3 text-xs font-semibold text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <span className="whitespace-nowrap">Prev</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentIndex < questions.length - 1) {
                  setCurrentIndex(currentIndex + 1);
                } else {
                  setShowConfirmModal(true);
                }
              }}
              className="flex-1 rounded-full py-3 px-6 text-xs font-bold text-white bg-[#1e293b] hover:bg-[#0f172a] shadow-xs transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span className="whitespace-nowrap">Next question</span>
            </button>
          </div>

          {/* Submit exam pill button matching screenshot */}
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={submitting}
            className="w-full rounded-full py-3.5 px-6 text-xs font-bold text-white bg-gradient-to-r from-[#5d5fef] to-[#6c5ce7] hover:opacity-95 shadow-md shadow-[#5d5fef]/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <span className="whitespace-nowrap">Submit exam</span>
            )}
          </button>

        </div>
      </div>

      {/* Manual Submission Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f8faff] text-[#5d5fef] flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              Submit Examination?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              You answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
              {unansweredCount > 0 && (
                <span className="block text-amber-600 mt-1 font-semibold">
                  ({unansweredCount} unanswered)
                </span>
              )}
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 px-4 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
              >
                <span className="whitespace-nowrap">Continue</span>
              </button>
              <button
                type="button"
                onClick={() => submitExam('manual')}
                disabled={submitting}
                className="py-2.5 px-4 rounded-full text-xs font-bold text-white bg-[#5d5fef] hover:bg-[#4d4fdf] cursor-pointer whitespace-nowrap"
              >
                <span className="whitespace-nowrap">Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
