import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { Question } from '../types';

interface GeminiAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onQuestionsImported: () => void;
}

export const GeminiAiModal: React.FC<GeminiAiModalProps> = ({
  isOpen,
  onClose,
  token,
  onQuestionsImported,
}) => {
  const [topic, setTopic] = useState('Cyber Security');
  const [count, setCount] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<string>('Intermediate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setGeneratedQuestions([]);

    if (!topic.trim()) {
      setError('Please provide a topic or subject.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: topic.trim(),
          count,
          difficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gemini AI generation failed');
      }

      setGeneratedQuestions(data.questions || []);
      setSuccessMessage(data.message || `Generated ${data.questions?.length || count} questions!`);
      onQuestionsImported();
    } catch (err: any) {
      setError(err.message || 'Error communicating with Gemini AI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-md sm:max-w-lg bg-white rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col my-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-5 gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5d5fef] to-[#6c5ce7] flex items-center justify-center text-white shadow-md shadow-[#5d5fef]/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">
                  AI Question Generator
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider whitespace-nowrap shrink-0">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically generate multiple-choice questions with Gemini AI
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto pr-1 space-y-4 flex-1">
          <form onSubmit={handleGenerate} className="space-y-4">
            
            {/* Topic Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Topic or Subject
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Cyber Security, Web Tech, Database Architecture"
                className="w-full px-4 py-3 rounded-2xl bg-[#f8faff] text-xs font-medium border border-slate-200 focus:bg-white focus:border-[#5d5fef] focus:outline-none transition-all placeholder:text-slate-400 shadow-2xs"
              />
            </div>

            {/* Question Count Pills */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Number of Questions
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 3, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCount(num)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      count === num
                        ? 'bg-[#5d5fef] text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span className="whitespace-nowrap">{num} {num === 1 ? 'Question' : 'Questions'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Pills */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      difficulty === lvl
                        ? 'bg-[#5d5fef] text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span className="whitespace-nowrap">{lvl}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Success banner */}
            {successMessage && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-3.5 px-6 text-xs font-bold text-white bg-gradient-to-r from-[#5d5fef] to-[#6c5ce7] hover:opacity-95 shadow-md shadow-[#5d5fef]/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span className="whitespace-nowrap">Generating with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Generate Questions</span>
                </>
              )}
            </button>
          </form>

          {/* Generated Questions Preview */}
          {generatedQuestions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5 whitespace-nowrap">
                Added to Question Bank ({generatedQuestions.length})
              </h4>
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {generatedQuestions.map((q, idx) => (
                  <div key={q.id} className="p-3 rounded-2xl bg-[#f8faff] border border-slate-100 text-xs">
                    <p className="font-bold text-slate-900 mb-1.5 leading-snug">
                      {idx + 1}. {q.text}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <span className={q.correctOption === 0 ? 'text-[#00b87c] font-bold' : 'text-slate-600'}>
                        A: {q.optionA}
                      </span>
                      <span className={q.correctOption === 1 ? 'text-[#00b87c] font-bold' : 'text-slate-600'}>
                        B: {q.optionB}
                      </span>
                      <span className={q.correctOption === 2 ? 'text-[#00b87c] font-bold' : 'text-slate-600'}>
                        C: {q.optionC}
                      </span>
                      <span className={q.correctOption === 3 ? 'text-[#00b87c] font-bold' : 'text-slate-600'}>
                        D: {q.optionD}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <span className="whitespace-nowrap">Done</span>
          </button>
        </div>

      </div>
    </div>
  );
};
