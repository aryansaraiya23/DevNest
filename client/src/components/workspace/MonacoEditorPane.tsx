import React, { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { detectMonacoLanguage } from '../../services/mockProjectService';
import { EditorCursorPosition } from '../../types/files';
import { FileCode, Sparkles } from 'lucide-react';

interface MonacoEditorPaneProps {
  fileName: string | null;
  content: string;
  onChangeContent: (newContent: string) => void;
  onCursorChange: (pos: EditorCursorPosition) => void;
  onSaveShortcut: () => void;
}

export const MonacoEditorPane: React.FC<MonacoEditorPaneProps> = ({
  fileName,
  content,
  onChangeContent,
  onCursorChange,
  onSaveShortcut,
}) => {
  const editorRef = useRef<any>(null);

  const language = fileName ? detectMonacoLanguage(fileName) : 'plaintext';

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Track cursor changes
    editor.onDidChangeCursorPosition((e) => {
      onCursorChange({
        lineNumber: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // Add Ctrl+S / Cmd+S save action
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSaveShortcut();
    });
  };

  if (!fileName) {
    return (
      <div className="flex-1 bg-slate-900 flex flex-col items-center justify-center text-slate-500 p-8 select-none">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
          <FileCode className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">No file selected</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs text-center leading-relaxed">
          Select a file from the explorer on the left or create a new file to start coding.
        </p>
        <div className="mt-4 flex items-center space-x-2 text-[11px] text-slate-500 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Press Ctrl+S anytime to save changes</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full w-full relative bg-slate-900 overflow-hidden">
      <Editor
        height="100%"
        width="100%"
        theme="vs-dark"
        language={language}
        value={content}
        onChange={(val) => onChangeContent(val || '')}
        onMount={handleEditorMount}
        loading={
          <div className="flex items-center justify-center h-full bg-slate-900 text-xs text-slate-400">
            Loading Monaco Editor...
          </div>
        }
        options={{
          automaticLayout: true,
          fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
          fontSize: 13,
          lineHeight: 20,
          minimap: { enabled: true, maxColumn: 80 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'all',
          tabSize: 4,
          formatOnPaste: true,
          bracketPairColorization: { enabled: true },
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
};
