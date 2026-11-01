import React, { useState } from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (fullName: string, email: string, password: string, role: 'student' | 'admin') => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  onTakeExamDirectly?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onRegister,
  loading,
  error,
  clearError,
  onTakeExamDirectly,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('admin@lumen.edu');
  const [password, setPassword] = useState('Admin@123');
  const [fullName, setFullName] = useState('Vikas Chaurasiya');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (isRegister) {
      await onRegister(fullName, email, password, 'admin');
    } else {
      await onLogin(email, password);
    }
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
        {/* Card matching IMG-20261101-WA0023_19fc07c9.jpg exactly */}
        <div className="bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-10 shadow-[0_10px_35px_rgba(93,95,239,0.06)] border border-slate-100">
          
          {/* Logo with purple circle dot */}
          <div className="flex items-center space-x-2.5 mb-8">
            <div className="w-7 h-7 rounded-full bg-white border border-slate-200/90 flex items-center justify-center shadow-xs shrink-0">
              <div className="w-3.5 h-3.5 rounded-full bg-[#5d5fef]" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 tracking-tight leading-none whitespace-nowrap">Lumen</div>
              <div className="text-[9px] font-bold text-slate-400 tracking-widest mt-0.5 whitespace-nowrap">EXAMS</div>
            </div>
          </div>

          {/* Heading */}
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">
            {isRegister ? 'CREATE ADMIN ACCOUNT' : 'WELCOME BACK'}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-6">
            {isRegister ? 'Register your console' : 'Sign in to your console'}
          </h1>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-5 py-3.5 rounded-full bg-[#f8faff] text-xs font-medium border border-transparent focus:bg-white focus:border-[#5d5fef] focus:outline-none transition-all placeholder:text-slate-400 shadow-2xs"
                />
              </div>
            )}

            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-5 py-3.5 rounded-full bg-[#f8faff] text-xs font-medium border border-transparent focus:bg-white focus:border-[#5d5fef] focus:outline-none transition-all placeholder:text-slate-400 shadow-2xs"
              />
            </div>

            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-5 py-3.5 rounded-full bg-[#f8faff] text-xs font-medium border border-transparent focus:bg-white focus:border-[#5d5fef] focus:outline-none transition-all placeholder:text-slate-400 shadow-2xs"
              />
            </div>

            {/* Pill Sign In Button matching screenshot */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-3.5 px-6 text-xs font-bold text-white bg-gradient-to-r from-[#5d5fef] to-[#6c5ce7] hover:opacity-95 shadow-md shadow-[#5d5fef]/20 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2 whitespace-nowrap"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <span className="whitespace-nowrap">{isRegister ? 'Create Account' : 'Sign in'}</span>
              )}
            </button>
          </form>

          {/* Toggle link matching screenshot */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                clearError();
              }}
              className="text-xs font-medium text-[#5d5fef] hover:underline transition-colors whitespace-nowrap cursor-pointer"
            >
              <span className="whitespace-nowrap">{isRegister ? 'Already have an account? Sign in' : 'No account? Create one'}</span>
            </button>
          </div>

          {/* Direct link for candidate taking exam */}
          {onTakeExamDirectly && (
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={onTakeExamDirectly}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center space-x-1 whitespace-nowrap cursor-pointer"
              >
                <span className="whitespace-nowrap">Take exam via student link</span>
                <span className="shrink-0">&rarr;</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
