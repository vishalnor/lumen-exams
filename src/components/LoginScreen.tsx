import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, UserPlus, Sparkles, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (fullName: string, email: string, password: string, role: 'student' | 'admin') => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onRegister,
  loading,
  error,
  clearError,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('vikas@student.edu');
  const [password, setPassword] = useState('Student@123');
  const [fullName, setFullName] = useState('Vikas Chaurasiya');
  const [role, setRole] = useState<'student' | 'admin'>('student');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (isRegister) {
      await onRegister(fullName, email, password, role);
    } else {
      await onLogin(email, password);
    }
  };

  const setPresetUser = (presetEmail: string, presetPass: string, presetRole: 'student' | 'admin') => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setRole(presetRole);
    setIsRegister(false);
    clearError();
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 overflow-hidden">
      {/* Ambient background glows matching Figure P.1 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-200/50 via-purple-200/40 to-blue-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-indigo-100/60 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="w-full max-w-md">
        {/* Card matching Figure P.1 exactly */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 sm:p-9 shadow-xl shadow-indigo-500/5 border border-white/80 ring-1 ring-slate-100 transition-all">
          
          {/* Logo & Brand Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex items-center space-x-1.5 mb-1">
              <span className="font-bold text-xl text-slate-900 tracking-tight">Lumen</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 uppercase tracking-wide">
                EXAMS
              </span>
            </div>
            <span className="text-xs uppercase tracking-widest font-semibold text-indigo-600 mt-2">
              {isRegister ? 'CREATE ACCOUNT' : 'WELCOME BACK'}
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {isRegister ? 'Register your examination account' : 'Sign in to your console'}
            </h1>
          </div>

          {/* Error Notice (plain-language error handling per SRS FR-AUTH-02) */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Vikas Chaurasiya"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                        role === 'student'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                        role === 'admin'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      Administrator
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.edu"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              {isRegister && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Policy: Minimum 8 characters with mixed case and numeric digit.
                </p>
              )}
            </div>

            {/* Gradient Sign In Button matching Figure P.1 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-600/25 active:scale-[0.99] disabled:opacity-70 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>{isRegister ? 'Create Account' : 'Sign in'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                clearError();
              }}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {isRegister ? 'Already have an account? Sign in' : 'No account? Create one'}
            </button>
          </div>

          {/* One-click quick login presets for evaluators */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-2.5">
              Instant Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPresetUser('vikas@student.edu', 'Student@123', 'student')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-200/70 hover:border-indigo-200 text-left transition-all group"
              >
                <div className="font-semibold text-slate-800 group-hover:text-indigo-700">
                  Student Portal
                </div>
                <div className="text-[10px] text-slate-500">Vikas Chaurasiya</div>
              </button>
              <button
                type="button"
                onClick={() => setPresetUser('admin@lumen.edu', 'Admin@123', 'admin')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50/80 border border-slate-200/70 hover:border-purple-200 text-left transition-all group"
              >
                <div className="font-semibold text-slate-800 group-hover:text-purple-700">
                  Admin Console
                </div>
                <div className="text-[10px] text-slate-500">Question Bank & Reports</div>
              </button>
            </div>
          </div>

        </div>

        {/* Project Footer Badge */}
        <div className="mt-4 text-center text-xs text-slate-500 font-medium">
          Thakur Ramnarayan College of Arts & Commerce &bull; Computer Science Dept.
        </div>
      </div>
    </div>
  );
};
