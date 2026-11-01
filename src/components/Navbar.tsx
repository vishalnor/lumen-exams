import React from 'react';
import { User } from '../types';
import { ShieldCheck, LogOut, UserCheck, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onSwitchUser?: (email: string) => void;
  activeView: string;
  onNavigate: (view: string) => void;
  examInProgress?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onSwitchUser,
  activeView,
  onNavigate,
  examInProgress = false,
}) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => !examInProgress && onNavigate(user?.role === 'admin' ? 'admin' : 'dashboard')}
            disabled={examInProgress}
            className="flex items-center space-x-2.5 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Lumen</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 uppercase tracking-wider">
                  EXAMS
                </span>
                <span className="hidden md:inline-flex items-center space-x-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>Firebase</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                AI-Based Online Exam Proctoring System
              </p>
            </div>
          </button>
        </div>

        {/* Center note if exam is in progress */}
        {examInProgress && (
          <div className="flex items-center space-x-2 bg-amber-50 text-amber-800 border border-amber-200/80 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Active Proctored Session &bull; Page Visibility Monitored</span>
          </div>
        )}

        {/* Right side controls */}
        {user ? (
          <div className="flex items-center space-x-3">
            {/* Quick Role / User Switcher for demonstration & evaluation */}
            {!examInProgress && (
              <div className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => onSwitchUser && onSwitchUser('vikas@student.edu')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    user.role === 'student'
                      ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Switch to Student Account (Vikas)"
                >
                  Student (Vikas)
                </button>
                <button
                  onClick={() => onSwitchUser && onSwitchUser('admin@lumen.edu')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    user.role === 'admin'
                      ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Switch to Administrator Console"
                >
                  Admin Console
                </button>
              </div>
            )}

            {/* User Info */}
            <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                {user.fullName.charAt(0)}
              </div>
              <div className="hidden lg:block text-left text-xs">
                <p className="font-semibold text-slate-900 leading-tight">{user.fullName}</p>
                <p className="text-slate-500 capitalize">{user.role}</p>
              </div>
            </div>

            {/* Logout button */}
            {!examInProgress && (
              <button
                onClick={onLogout}
                className="flex items-center space-x-1 text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-xs font-medium transition-colors"
                title="Sign out of system"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-500 font-medium">Academic Build v1.0</div>
        )}
      </div>
    </header>
  );
};
