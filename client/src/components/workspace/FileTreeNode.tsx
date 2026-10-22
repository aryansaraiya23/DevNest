import React, { useState } from 'react';
import { FileNode, FileSystemItemType } from '../../types/files';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  File,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  Plus,
} from 'lucide-react';

interface FileTreeNodeProps {
  node: FileNode;
  level?: number;
  activeFileId: string | null;
  onSelectFile: (file: FileNode) => void;
  onToggleFolder: (folderId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onRenameNode: (nodeId: string, newName: string) => void;
  onOpenCreateModal: (type: FileSystemItemType, parentFolderId: string, parentName: string) => void;
}

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  node,
  level = 0,
  activeFileId,
  onSelectFile,
  onToggleFolder,
  onDeleteNode,
  onRenameNode,
  onOpenCreateModal,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);

  const isFolder = node.type === 'folder';
  const isActive = !isFolder && activeFileId === node.id;

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (renameValue.trim() && renameValue.trim() !== node.name) {
      onRenameNode(node.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'cpp':
      case 'cxx':
      case 'cc':
        return <FileCode className="w-4 h-4 text-blue-400 shrink-0" />;
      case 'h':
      case 'hpp':
        return <FileCode className="w-4 h-4 text-sky-400 shrink-0" />;
      case 'py':
        return <FileCode className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'js':
      case 'jsx':
        return <FileCode className="w-4 h-4 text-yellow-400 shrink-0" />;
      case 'ts':
      case 'tsx':
        return <FileCode className="w-4 h-4 text-blue-300 shrink-0" />;
      case 'md':
        return <FileText className="w-4 h-4 text-emerald-400 shrink-0" />;
      default:
        return <File className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div>
      <div
        className={`group flex items-center justify-between py-1 px-2 rounded-md cursor-pointer transition-colors text-xs select-none ${
          isActive
            ? 'bg-slate-800 text-brand-300 font-medium'
            : 'text-slate-300 hover:bg-slate-850 hover:text-slate-100'
        }`}
        style={{ paddingLeft: `${Math.max(level * 14 + 6, 6)}px` }}
        onClick={() => {
          if (isFolder) {
            onToggleFolder(node.id);
          } else {
            onSelectFile(node);
          }
        }}
      >
        {/* Left side: Chevron/Icon & Name */}
        <div className="flex items-center space-x-1.5 flex-1 min-w-0 pr-1">
          {isFolder ? (
            <span className="p-0.5 text-slate-400 hover:text-slate-200">
              {node.isOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </span>
          ) : (
            <span className="w-3.5" /> // spacer
          )}

          {isFolder ? (
            node.isOpen ? (
              <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-amber-400 shrink-0" />
            )
          ) : (
            getFileIcon(node.name)
          )}

          {isRenaming ? (
            <form onSubmit={handleRenameSubmit} onClick={(e) => e.stopPropagation()} className="flex-1">
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameSubmit}
                autoFocus
                className="w-full bg-slate-950 border border-brand-500/80 rounded px-1.5 py-0.5 text-xs text-white outline-none"
              />
            </form>
          ) : (
            <span className="truncate" title={node.path}>
              {node.name}
            </span>
          )}
        </div>

        {/* Right side hover actions */}
        {!isRenaming && (
          <div
            className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {isFolder && (
              <button
                onClick={() => onOpenCreateModal('file', node.id, node.name)}
                title="Add file inside folder"
                className="p-1 hover:text-brand-300 text-slate-400 rounded"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={() => {
                setRenameValue(node.name);
                setIsRenaming(true);
              }}
              title="Rename"
              className="p-1 hover:text-slate-200 text-slate-400 rounded"
            >
              <Edit2 className="w-3 h-3" />
            </button>

            <button
              onClick={() => onDeleteNode(node.id)}
              title="Delete"
              className="p-1 hover:text-rose-400 text-slate-400 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Render children if folder is open */}
      {isFolder && node.isOpen && node.children && node.children.length > 0 && (
        <div className="flex flex-col">
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              activeFileId={activeFileId}
              onSelectFile={onSelectFile}
              onToggleFolder={onToggleFolder}
              onDeleteNode={onDeleteNode}
              onRenameNode={onRenameNode}
              onOpenCreateModal={onOpenCreateModal}
            />
          ))}
        </div>
      )}
    </div>
  );
};
