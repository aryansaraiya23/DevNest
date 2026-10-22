import React, { useState } from 'react';
import { OpenTab } from '../../types/files';
import { X, Circle, FileCode, FileText, File } from 'lucide-react';

interface EditorTabsProps {
  tabs: OpenTab[];
  activeTabId: string | null;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string, force?: boolean) => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
}) => {
  const [confirmCloseTab, setConfirmCloseTab] = useState<OpenTab | null>(null);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'cpp':
      case 'cxx':
      case 'cc':
      case 'h':
      case 'hpp':
        return <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'py':
        return <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <FileCode className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
      case 'md':
        return <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      default:
        return <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  const handleCloseClick = (e: React.MouseEvent, tab: OpenTab) => {
    e.stopPropagation();
    if (tab.isDirty) {
      setConfirmCloseTab(tab);
    } else {
      onCloseTab(tab.fileId);
    }
  };

  return (
    <>
      <div className="h-9 bg-slate-950 border-b border-slate-800 flex items-center overflow-x-auto select-none no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.fileId === activeTabId;

          return (
            <div
              key={tab.fileId}
              onClick={() => onSelectTab(tab.fileId)}
              className={`group h-full flex items-center space-x-2 px-3 border-r border-slate-800/80 text-xs cursor-pointer transition-colors shrink-0 max-w-[200px] ${
                isActive
                  ? 'bg-slate-900 text-slate-100 border-t-2 border-t-brand-500 font-medium'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
              }`}
            >
              {getFileIcon(tab.fileName)}
              <span className="truncate" title={tab.filePath}>
                {tab.fileName}
              </span>

              {/* Dirty indicator or close button */}
              <div className="flex items-center ml-1">
                {tab.isDirty ? (
                  <span
                    onClick={(e) => handleCloseClick(e, tab)}
                    title="Unsaved changes. Click to close."
                    className="p-0.5 rounded hover:bg-slate-800 text-amber-400"
                  >
                    <Circle className="w-2 h-2 fill-amber-400" />
                  </span>
                ) : (
                  <button
                    onClick={(e) => handleCloseClick(e, tab)}
                    title="Close tab"
                    className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-200 opacity-60 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unsaved changes confirmation dialog */}
      {confirmCloseTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Unsaved Changes</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Do you want to discard unsaved changes to{' '}
              <strong className="text-slate-100 font-mono">{confirmCloseTab.fileName}</strong>?
            </p>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end space-x-2">
              <button
                onClick={() => setConfirmCloseTab(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const id = confirmCloseTab.fileId;
                  setConfirmCloseTab(null);
                  onCloseTab(id, true);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-lg transition-colors"
              >
                Discard & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
