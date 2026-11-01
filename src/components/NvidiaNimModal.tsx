import React, { useState } from 'react';
import { Sparkles, Key, CheckCircle2, AlertCircle, Cpu, Loader2, ArrowRight } from 'lucide-react';
import { Question } from '../types';

interface NvidiaNimModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onQuestionsImported: () => void;
}

export const NvidiaNimModal: React.FC<NvidiaNimModalProps> = ({
  isOpen,
  onClose,
  token,
  onQuestionsImported,
}) => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('LUMEN_NVIDIA_NIM_KEY') || '');
  const [model, setModel] = useState('meta/llama-3.3-70b-instruct');
  const [topic, setTopic] = useState('Cybersecurity & Network Defense');
  const [count, setCount] = useState(3);
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('LUMEN_NVIDIA_NIM_KEY', key);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setGeneratedQuestions([]);

    if (!apiKey.trim()) {
      setError('Please provide your NVIDIA NIM API key to generate questions via the NIM API.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ai/generate-questions-nim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model,
          topic,
          count,
          difficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'NVIDIA NIM generation failed');
      }

      setGeneratedQuestions(data.questions || []);
      setSuccessMessage(data.message || `Successfully generated questions with ${model}!`);
      onQuestionsImported();
    } catch (err: any) {
      setError(err.message || 'Error communicating with NVIDIA NIM endpoint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 my-8 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900">NVIDIA NIM Question Generator</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                  AI Model
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Generate high-quality multiple choice questions powered by NVIDIA NIM API
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* API Key Input */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-600" />
              <span>NVIDIA NIM API Key</span>
            </span>
            <span className="text-[11px] font-normal text-slate-500">
              (Starts with <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">nvapi-...</code>)
            </span>
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => handleSaveKey(e.target.value)}
            placeholder="Paste your NVIDIA NIM API key here"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
          <p className="text-[11px] text-slate-500 mt-1.5">
            Key is securely preserved locally for this session. Get your key anytime from{' '}
            <a
              href="https://build.nvidia.com"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 hover:underline font-semibold"
            >
              build.nvidia.com
            </a>.
          </p>
        </div>

        {/* Generation Form */}
        <form onSubmit={handleGenerate} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NVIDIA NIM Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="meta/llama-3.3-70b-instruct">meta/llama-3.3-70b-instruct (Recommended)</option>
                <option value="nvidia/llama-3.1-nemotron-70b-instruct">nvidia/llama-3.1-nemotron-70b-instruct</option>
                <option value="mistralai/mixtral-8x22b-instruct">mistralai/mixtral-8x22b-instruct</option>
                <option value="meta/llama-3.1-405b-instruct">meta/llama-3.1-405b-instruct (Heavy)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Question Count
              </label>
              <select
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value={1}>1 Question</option>
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Topic / Subject Domain
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Cybersecurity, Web Technologies, Database"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 text-[11px] font-semibold rounded-lg border transition-all ${
                      difficulty === lvl
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 disabled:opacity-60 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Invoking NVIDIA NIM Engine...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Questions via NVIDIA NIM</span>
              </>
            )}
          </button>
        </form>

        {/* Preview of Generated Questions */}
        {generatedQuestions.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Generated & Added to Question Bank ({generatedQuestions.length})
            </h4>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {generatedQuestions.map((q, idx) => (
                <div key={q.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <p className="font-bold text-slate-800 mb-1.5">
                    {idx + 1}. {q.text}
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                    <span className={q.correctOption === 0 ? 'text-emerald-700 font-bold' : ''}>
                      A: {q.optionA}
                    </span>
                    <span className={q.correctOption === 1 ? 'text-emerald-700 font-bold' : ''}>
                      B: {q.optionB}
                    </span>
                    <span className={q.correctOption === 2 ? 'text-emerald-700 font-bold' : ''}>
                      C: {q.optionC}
                    </span>
                    <span className={q.correctOption === 3 ? 'text-emerald-700 font-bold' : ''}>
                      D: {q.optionD}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
