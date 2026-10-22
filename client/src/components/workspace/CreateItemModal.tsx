import React, { useState } from 'react';
import { FileSystemItemType } from '../../types/files';
import { X, FileCode, Folder } from 'lucide-react';

interface CreateItemModalProps {
  isOpen: boolean;
  itemType: FileSystemItemType;
  parentFolderId: string | null;
  parentFolderName: string | null;
  onClose: () => void;
  onCreate: (name: string, type: FileSystemItemType, parentFolderId: string | null) => void;
}

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  itemType,
  parentFolderId,
  parentFolderName,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(`Please enter a valid ${itemType} name.`);
      return;
    }

    if (trimmed.includes('/') || trimmed.includes('\\')) {
      setError('Name cannot contain slashes.');
      return;
    }

    onCreate(trimmed, itemType, parentFolderId);
    setName('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            {itemType === 'file' ? (
              <FileCode className="w-4 h-4 text-brand-400" />
            ) : (
              <Folder className="w-4 h-4 text-amber-400" />
            )}
            <h3 className="text-sm font-bold text-white">
              Create New {itemType === 'file' ? 'File' : 'Folder'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {parentFolderName && (
          <p className="text-[11px] text-slate-400 mt-2">
            Target folder: <span className="text-slate-200 font-mono">{parentFolderName}</span>
          </p>
        )}

        {error && (
          <div className="mt-3 p-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {itemType === 'file' ? 'File Name (with extension)' : 'Folder Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder={itemType === 'file' ? 'e.g. algorithms.cpp' : 'e.g. tests'}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/80 transition-colors"
              autoFocus
            />
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-semibold text-xs rounded-lg transition-colors shadow-sm"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
