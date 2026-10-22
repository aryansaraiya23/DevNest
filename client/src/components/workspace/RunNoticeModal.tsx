import React from 'react';
import { Play, Sparkles, X, ArrowRight, ShieldCheck } from 'lucide-react';

interface RunNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  language: string;
}

export const RunNoticeModal: React.FC<RunNoticeModalProps> = ({
  isOpen,
  onClose,
  projectName,
  language,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
            <Play className="w-5 h-5 fill-brand-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white">Execution Engine Status</h2>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Milestone 1 Prototype
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              You clicked <strong>Run</strong> for <code className="text-emerald-400 font-mono bg-slate-950 px-1 py-0.5 rounded">{projectName}</code> ({language.toUpperCase()}).
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-400">
          <div className="flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
            <span>
              In this Milestone 1 prototype, full in-browser Monaco editing, multi-file tree management, and tab switching are completely interactive.
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <span>
              Real remote sandboxed execution with <strong className="text-slate-200">Judge0 API</strong>, CPU/memory telemetry, and live stdout streams will be connected in <strong>Milestone 3</strong>.
            </span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-slate-950 text-xs font-semibold rounded-xl transition-colors shadow-sm flex items-center space-x-1.5"
          >
            <span>Understood</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
