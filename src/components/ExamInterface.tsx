import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Question, ExamAttempt } from '../types';
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, Send, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ExamInterfaceProps {
  user: User;
  token: string;
  examId: string;
  onSubmitted: (attemptId: string) => void;
  onExit: () => void;
}

export const ExamInterface: React.FC<ExamInterfaceProps> = ({
  user,
  token,
  examId,
  onSubmitted,
  onExit,
}) => {
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tabWarning, setTabWarning] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // References for clean event cleanup and intervals
  const attemptRef = useRef<ExamAttempt | null>(null);
  attemptRef.current = attempt;

  // 1. Start or resume attempt on mount
  useEffect(() => {
    let isMounted = true;
    const startAttempt = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await fetch('/api/attempts/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ examId }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}: Failed to start attempt`);
        }

        const data = await res.json();
        if (!isMounted) return;

        setAttempt({
          id: data.attemptId,
          examId,
          studentId: user.id,
          startedAt: data.startedAt,
          deadlineAt: data.deadlineAt,
          status: 'in_progress',
        });
        setQuestions(data.questions || []);
        setRemainingSeconds(data.remainingSeconds ?? 0);

        // Preload answers if resuming
        if (data.answers && Array.isArray(data.answers)) {
          const ansMap: Record<string, number> = {};
          data.answers.forEach((ans: any) => {
            ansMap[ans.questionId] = ans.selectedOption;
          });
          setSelectedAnswers(ansMap);
        }
      } catch (err: any) {
        if (isMounted) setErrorMessage(err.message || 'Error initializing exam session');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    startAttempt();
    return () => {
      isMounted = false;
    };
  }, [examId, token, user.id]);

  // 2. Server-Authoritative Countdown Timer (FR-EXAM-03 & FR-EXAM-04)
  useEffect(() => {
    if (!attempt || attempt.status === 'submitted') return;

    // Tick countdown every second
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Periodic synchronization with server deadline (FR-EXAM-03)
    const syncInterval = setInterval(async () => {
      if (!attemptRef.current) return;
      try {
        const res = await fetch(`/api/attempts/${attemptRef.current.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.remainingSeconds !== undefined) {
            setRemainingSeconds(data.remainingSeconds);
          }
        }
      } catch {
        // network jitter, continue local countdown
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, [attempt?.id, attempt?.status, token]);

  // 3. Tab-Switch & Page Visibility Proctoring (FR-PROC-01, FR-PROC-02, FR-PROC-03, FR-PROC-04)
  useEffect(() => {
    if (!attempt || attempt.status === 'submitted') return;

    const reportViolation = (eventType: string, details?: string) => {
      if (!attemptRef.current) return;
      const payload = {
        attemptId: attemptRef.current.id,
        eventType,
        details: details || `Client detected: ${eventType}`,
      };

      // Use standard fetch if window active
      fetch('/api/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden / switched away
        reportViolation('hidden', 'Page Visibility API: Document hidden (user switched away)');
      } else {
        // Tab returned to visible
        reportViolation('visible', 'Page Visibility API: Document visible (user returned to exam)');
        // Non-revealing warning per FR-PROC-04 (count is concealed)
        setTabWarning('Focus Alert: Navigating away from the examination tab is logged for proctor review.');
        setTimeout(() => setTabWarning(null), 6000);
      }
    };

    const handleBlur = () => {
      reportViolation('blur', 'Window lost focus');
    };

    // Use navigator.sendBeacon when page is unloading or closing
    const handlePageHide = () => {
      if (attemptRef.current && navigator.sendBeacon) {
        const payload = JSON.stringify({
          attemptId: attemptRef.current.id,
          eventType: 'page_unload',
          details: 'Beacon API: Examination window or tab closed abruptly',
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
  }, [attempt?.id, attempt?.status]);

  // 4. Save answer to server (FR-EXAM-02)
  const handleSelectOption = async (optionIndex: number) => {
    if (!attempt || attempt.status === 'submitted') return;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    // Update locally immediately
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));

    setSavingAnswer(true);
    try {
      const res = await fetch('/api/answers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          attemptId: attempt.id,
          questionId: currentQ.id,
          selectedOption: optionIndex,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 409) {
          // Time expired or already submitted
          handleAutoSubmit();
        }
      }
    } catch {
      // offline/retry
    } finally {
      setSavingAnswer(false);
    }
  };

  // 5. Submit Attempt (FR-EXAM-04 Auto-submit & FR-EXAM-05 Manual submit)
  const submitExam = useCallback(
    async (reason: 'manual' | 'auto') => {
      if (!attempt || submitting) return;
      setSubmitting(true);
      setShowConfirmModal(false);

      try {
        const res = await fetch(`/api/attempts/${attempt.id}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to submit exam');
        }

        onSubmitted(attempt.id);
      } catch (err: any) {
        setErrorMessage(err.message || 'Submission error');
        setSubmitting(false);
      }
    },
    [attempt, onSubmitted, submitting, token]
  );

  const handleAutoSubmit = useCallback(() => {
    submitExam('auto');
  }, [submitExam]);

  // Format time (MM:SS)
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isTimeLow = remainingSeconds > 0 && remainingSeconds <= 120; // under 2 minutes

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = questions.length - answeredCount;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center border border-slate-200 shadow-xl">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="font-bold text-slate-800 text-sm">Preparing Examination Session</h2>
          <p className="text-xs text-slate-400 mt-1">
            Setting up server-authoritative timer and proctoring listeners...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage && !attempt) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-rose-200 shadow-xl text-center">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="font-bold text-slate-800 text-base mb-1">Unable to Open Examination</h2>
          <p className="text-xs text-rose-600 mb-6">{errorMessage}</p>
          <button
            onClick={onExit}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const optionsList = [
    { label: 'A', text: currentQ?.optionA, index: 0 },
    { label: 'B', text: currentQ?.optionB, index: 1 },
    { label: 'C', text: currentQ?.optionC, index: 2 },
    { label: 'D', text: currentQ?.optionD, index: 3 },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] py-6 px-4 sm:px-6 max-w-3xl mx-auto flex flex-col justify-between">
      
      {/* Top Banner & Header matching Figure P.3 */}
      <div>
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs mb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              NOW ANSWERING
            </span>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Cyber</h2>
              <span className="text-xs font-medium text-slate-500">
                &bull; Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
          </div>

          {/* Prominent Countdown Timer matching Figure P.3 */}
          <div
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-mono text-sm font-bold border transition-colors ${
              isTimeLow
                ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeLow ? 'text-rose-500' : 'text-slate-500'}`} />
            <span>{formattedTime} left</span>
          </div>
        </div>

        {/* Warning Toast for Tab Switching (Non-revealing per FR-PROC-04) */}
        {tabWarning && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-500 text-white text-xs font-medium shadow-md shadow-amber-500/20 flex items-center space-x-2.5 animate-in slide-in-from-top-2 duration-200">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div className="flex-1">{tabWarning}</div>
          </div>
        )}

        {/* Question Card matching Figure P.3 */}
        {currentQ && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm transition-all">
            {/* Question Counter Pill */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                QUESTION {currentIndex + 1}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>

            {/* Question Text */}
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed mb-6">
              {currentQ.text}
            </h1>

            {/* Answer Options styled exactly like Figure P.3 */}
            <div className="space-y-3 mb-8">
              {optionsList.map((opt) => {
                const isSelected = selectedAnswers[currentQ.id] === opt.index;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleSelectOption(opt.index)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center space-x-3.5 cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-gradient-to-r from-indigo-50/80 to-purple-50/40 text-slate-900 ring-2 ring-indigo-600/20 shadow-xs'
                        : 'border-slate-200/90 bg-white hover:border-indigo-200 hover:bg-slate-50/60 text-slate-800'
                    }`}
                  >
                    {/* Option Label Letter (A, B, C, D) */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {opt.label}
                    </div>

                    <span className="text-sm font-medium flex-1">{opt.text}</span>

                    {/* Radio indicator */}
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Prev and Next navigation */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIndex === questions.length - 1}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>Next question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Submit Exam Button matching Figure P.3 & P.4 */}
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          disabled={submitting}
          className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-600/25 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Submit exam</span>
        </button>
        <p className="text-center text-[11px] text-slate-400 mt-2 font-medium">
          Answered {answeredCount} of {questions.length} questions
        </p>
      </div>

      {/* Manual Submission Confirmation Modal matching Figure P.4 & Section 4.5 */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Submit Examination?
            </h3>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              You have answered <strong className="text-slate-900 font-bold">{answeredCount}</strong> of{' '}
              <strong className="text-slate-900 font-bold">{questions.length}</strong> questions.
              {unansweredCount > 0 && (
                <span className="block mt-1 text-amber-700 font-semibold">
                  Note: You still have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}.
                </span>
              )}
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 mb-5">
              Once submitted, your answers cannot be altered and will be evaluated by the server according to academic requirement FR-RES-01.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Review questions
              </button>

              <button
                type="button"
                onClick={() => submitExam('manual')}
                disabled={submitting}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center space-x-1 cursor-pointer shadow-xs shadow-indigo-600/20"
              >
                {submitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>Confirm & Submit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
