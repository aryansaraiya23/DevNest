import React, { useState } from 'react';
import { BottomPanelTab } from '../../types/ide';
import {
  Terminal as TerminalIcon,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';

interface BottomPanelProps {
  activeTab: BottomPanelTab;
  onTabChange: (tab: BottomPanelTab) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  outputLog?: string[];
  onClearOutput?: () => void;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onToggleOpen,
  outputLog = [],
  onClearOutput,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen) {
    return (
      <div className="h-7 bg-slate-950 border-t border-slate-800 px-3 flex items-center justify-between select-none">
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={onToggleOpen}
            className="flex items-center space-x-1.5 text-slate-400 hover:text-slate-200 transition-colors py-0.5"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span className="font-medium text-[11px] uppercase tracking-wider">Show Panel</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-t border-slate-800 bg-slate-950 flex flex-col transition-all duration-200 select-none ${
        isExpanded ? 'h-72' : 'h-44'
      }`}
    >
      {/* Panel header bar */}
      <div className="h-8 border-b border-slate-800 px-2 flex items-center justify-between shrink-0 bg-slate-950">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onTabChange('output')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              activeTab === 'output'
                ? 'bg-slate-850 text-brand-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Output</span>
          </button>

          <button
            onClick={() => onTabChange('problems')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              activeTab === 'problems'
                ? 'bg-slate-850 text-brand-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Problems</span>
            <span className="text-[10px] px-1.5 rounded-full bg-slate-800 text-slate-300">0</span>
          </button>

          <button
            onClick={() => onTabChange('terminal')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              activeTab === 'terminal'
                ? 'bg-slate-850 text-brand-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Terminal</span>
            <span className="text-[9px] uppercase px-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Planned
            </span>
          </button>
        </div>

        {/* Panel controls */}
        <div className="flex items-center space-x-1 text-slate-400">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Restore Size' : 'Maximize Panel'}
            className="p-1 rounded hover:bg-slate-850 hover:text-slate-200 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onToggleOpen}
            title="Collapse Panel"
            className="p-1 rounded hover:bg-slate-850 hover:text-slate-200 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Panel tab content */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs text-slate-300 bg-slate-950/90">
        {activeTab === 'output' && (
          <div className="space-y-2 select-text">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 font-sans">
              <div className="flex items-center space-x-2 text-brand-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>DevNest Execution Console — Milestone 1 Prototype</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Live program compilation and execution using the isolated Judge0 backend will be activated in{' '}
                <strong className="text-slate-200">Milestone 3</strong>.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-800/80 flex items-center space-x-2">
                <Info className="w-3 h-3 text-slate-400" />
                <span>
                  Supported languages for remote execution: JavaScript (Node.js), Python 3, C++ (GCC), and Java (OpenJDK).
                </span>
              </div>
            </div>

            {outputLog.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between pb-1 text-slate-500 text-[11px] font-sans">
                  <span>Session History</span>
                  {onClearOutput && (
                    <button onClick={onClearOutput} className="text-slate-400 hover:text-slate-200 underline">
                      Clear
                    </button>
                  )}
                </div>
                {outputLog.map((line, idx) => (
                  <div key={idx} className="text-slate-300 py-0.5">
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 font-sans">
            <CheckCircle2 className="w-7 h-7 text-emerald-400/80 mb-2" />
            <p className="text-xs font-medium text-slate-300">No problems detected in the workspace</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Syntax errors and linter warnings will appear here when active analysis is enabled.
            </p>
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 font-sans">
            <TerminalIcon className="w-8 h-8 text-slate-600 mb-2" />
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-300">Container Terminal</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                Scheduled Feature
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm text-center leading-relaxed">
              Interactive terminal access to an isolated container runner will be implemented in a future release.
              Terminal commands are currently disabled in this frontend prototype.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
