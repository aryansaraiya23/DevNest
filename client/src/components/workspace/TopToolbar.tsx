import React from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@devnest/shared';
import {
  Code2,
  ArrowLeft,
  Play,
  Save,
  Check,
  Circle,
  Sidebar as SidebarIcon,
  HelpCircle,
} from 'lucide-react';

interface TopToolbarProps {
  projectName: string;
  language: SupportedLanguage;
  isDirty: boolean;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onRun: () => void;
  onSave: () => void;
  onBackToDashboard: () => void;
  onToggleSidebar: () => void;
  onOpenHelp: () => void;
  isSidebarOpen: boolean;
  isRunning?: boolean;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  projectName,
  language,
  isDirty,
  onLanguageChange,
  onRun,
  onSave,
  onBackToDashboard,
  onToggleSidebar,
  onOpenHelp,
  isSidebarOpen,
  isRunning = false,
}) => {
  return (
    <header className="h-12 border-b border-slate-800 bg-slate-950 px-3 flex items-center justify-between select-none z-20">
      {/* Left section: Back, Logo, Project name, Sidebar toggle */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={onBackToDashboard}
          title="Back to Dashboard"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Collapse Explorer' : 'Expand Explorer'}
          className={`p-1.5 rounded-lg transition-colors ${
            isSidebarOpen
              ? 'text-brand-400 bg-slate-850'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <SidebarIcon className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-bold text-slate-950 text-xs shadow-sm">
            <Code2 className="w-3.5 h-3.5 text-slate-950" />
          </div>
          <span className="text-xs font-semibold text-slate-200 tracking-tight max-w-[200px] truncate" title={projectName}>
            {projectName}
          </span>
        </div>
      </div>

      {/* Center section: Run Button & Save Status */}
      <div className="flex items-center space-x-3">
        {/* Run button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-all ${
            isRunning
              ? 'bg-brand-400/80 cursor-not-allowed opacity-90'
              : 'bg-brand-500 hover:bg-brand-600 transform active:scale-95'
          }`}
          title={isRunning ? 'Executing program in sandbox...' : 'Run project code'}
        >
          {isRunning ? (
            <>
              <svg className="animate-spin -ml-0.5 mr-1 h-3.5 w-3.5 text-slate-950" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Run</span>
            </>
          )}
        </button>

        {/* Save button and indicator */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={onSave}
            title="Save active file (Ctrl+S)"
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
              isDirty
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <div
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] ${
              isDirty ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            {isDirty ? (
              <>
                <Circle className="w-2 h-2 fill-amber-400 text-amber-400 animate-pulse" />
                <span className="hidden md:inline">Unsaved Changes</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="hidden md:inline">Saved</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right section: Language selector & Help */}
      <div className="flex items-center space-x-2">
        {/* Language selector */}
        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
          <span className="hidden sm:inline text-slate-500 text-[11px]">Env:</span>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-brand-500/80 transition-colors cursor-pointer"
          >
            {(Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]).map((langKey) => (
              <option key={langKey} value={langKey}>
                {SUPPORTED_LANGUAGES[langKey].name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onOpenHelp}
          title="Milestone info"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
