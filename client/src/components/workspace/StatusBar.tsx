import React from 'react';
import { EditorCursorPosition } from '../../types/files';
import { detectMonacoLanguage } from '../../services/mockProjectService';

interface StatusBarProps {
  activeFileName: string | null;
  cursorPosition: EditorCursorPosition;
  isDirty: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  activeFileName,
  cursorPosition,
  isDirty,
}) => {
  const rawLang = activeFileName ? detectMonacoLanguage(activeFileName) : 'plain';
  const formatLangName = (l: string) => {
    switch (l) {
      case 'cpp':
        return 'C++';
      case 'python':
        return 'Python';
      case 'javascript':
        return 'JavaScript';
      case 'typescript':
        return 'TypeScript';
      case 'markdown':
        return 'Markdown';
      case 'json':
        return 'JSON';
      default:
        return l.toUpperCase();
    }
  };

  return (
    <footer className="h-6 bg-slate-950 border-t border-slate-800/80 px-3 flex items-center justify-between text-[11px] text-slate-400 select-none shrink-0 z-10">
      {/* Left side: System status */}
      <div className="flex items-center space-x-3">
        <span className="flex items-center space-x-1.5 text-slate-300">
          <span
            className={`w-1.5 h-1.5 rounded-full ${isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}
          />
          <span>{isDirty ? 'Modified' : 'Ready'}</span>
        </span>

        {activeFileName && (
          <span className="text-slate-500 hidden sm:inline truncate max-w-[200px]">
            {activeFileName}
          </span>
        )}
      </div>

      {/* Right side: Editor metrics */}
      <div className="flex items-center space-x-4">
        {activeFileName && (
          <>
            <span className="text-slate-400 font-mono">
              Ln {cursorPosition.lineNumber}, Col {cursorPosition.column}
            </span>

            <span className="hidden sm:inline text-slate-500">Spaces: 4</span>

            <span className="hidden md:inline text-slate-500">UTF-8</span>

            <span className="font-semibold text-slate-300">{formatLangName(rawLang)}</span>
          </>
        )}
        <span className="text-slate-600">DevNest v1.0</span>
      </div>
    </footer>
  );
};
