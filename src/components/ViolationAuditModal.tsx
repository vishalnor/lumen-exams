import React from 'react';
import { ConsolidatedReportRow, Violation } from '../types';
import { ShieldAlert, Clock, CheckCircle2, AlertTriangle, EyeOff, Eye, ExternalLink } from 'lucide-react';

interface ViolationAuditModalProps {
  row: ConsolidatedReportRow | null;
  onClose: () => void;
}

export const ViolationAuditModal: React.FC<ViolationAuditModalProps> = ({ row, onClose }) => {
  if (!row) return null;

  const violations = row.violations || [];
  const riskLevel =
    violations.length === 0 ? 'Low (Clean)' : violations.length <= 2 ? 'Moderate Risk' : 'High Risk';
  const riskColor =
    violations.length === 0
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : violations.length <= 2
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 my-8 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900">Proctoring Violation Audit Log</h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wider ${riskColor}`}>
                  {riskLevel}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Server-authoritative timestamped events &bull; Page Visibility API (FR-PROC-03)
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

        {/* Student & Attempt Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-6 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Student</span>
            <span className="font-bold text-slate-900">{row.studentName}</span>
            <span className="text-[10px] text-slate-500 block truncate">{row.studentEmail}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Score</span>
            <span className="font-bold text-slate-900 text-sm">
              {row.score} / {row.totalQuestions} ({row.percentage}%)
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Submission</span>
            <span className="font-semibold text-slate-800 capitalize">
              {row.submissionReason === 'auto' ? 'Auto (Time Limit)' : 'Manual Submit'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Total Tab Switches</span>
            <span className="font-bold text-slate-900 text-sm">
              {violations.length} recorded
            </span>
          </div>
        </div>

        {/* Violations Timeline */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Chronological Server-Logged Events
          </h4>

          {violations.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-emerald-900">Zero Tab Switches Detected</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                The student stayed focused on the examination tab throughout the entire session.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {violations.map((v, i) => {
                const date = new Date(v.occurredAt);
                const timeStr = date.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <div
                    key={v.id || i}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          v.eventType === 'hidden' || v.eventType === 'page_unload'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {v.eventType === 'hidden' ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : v.eventType === 'visible' ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">
                          {v.eventType === 'hidden'
                            ? 'Tab Hidden / Departed Exam Window'
                            : v.eventType === 'visible'
                            ? 'Tab Returned to Active View'
                            : v.eventType === 'page_unload'
                            ? 'Page Unload / Closed (Beacon API)'
                            : `Focus Event: ${v.eventType}`}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{v.details}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <div className="font-mono text-xs font-semibold text-slate-700">{timeStr}</div>
                      <span className="text-[10px] text-slate-400">Server Clock</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Academic Note */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 mb-6 leading-relaxed">
          <strong>Academic Note (SRS Section 2.1 & 7.3):</strong> A visibility event alone does not prove malicious malpractice as it may trigger due to system alerts, window switching, or peripheral clicks. It serves as an evidentiary signal to be weighed alongside student scoring by an invigilator.
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close Audit Log
          </button>
        </div>

      </div>
    </div>
  );
};
