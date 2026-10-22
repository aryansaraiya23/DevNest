import React, { useState } from 'react';
import { FileNode, FileSystemItemType } from '../../types/files';
import { FileTreeNode } from './FileTreeNode';
import { CreateItemModal } from './CreateItemModal';
import { FilePlus, FolderPlus, FolderTree } from 'lucide-react';

interface SidebarProps {
  files: FileNode[];
  activeFileId: string | null;
  onSelectFile: (file: FileNode) => void;
  onToggleFolder: (folderId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onRenameNode: (nodeId: string, newName: string) => void;
  onCreateItem: (name: string, type: FileSystemItemType, parentFolderId: string | null) => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onToggleFolder,
  onDeleteNode,
  onRenameNode,
  onCreateItem,
  isOpen,
}) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: FileSystemItemType;
    parentFolderId: string | null;
    parentFolderName: string | null;
  }>({
    isOpen: false,
    type: 'file',
    parentFolderId: null,
    parentFolderName: null,
  });

  if (!isOpen) return null;

  const handleOpenCreateModal = (
    type: FileSystemItemType,
    parentFolderId: string | null = null,
    parentFolderName: string | null = null
  ) => {
    setModalState({
      isOpen: true,
      type,
      parentFolderId,
      parentFolderName,
    });
  };

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col h-full select-none shrink-0">
      {/* Explorer header */}
      <div className="h-9 px-3 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <span className="flex items-center space-x-1.5 text-slate-300">
          <FolderTree className="w-3.5 h-3.5 text-brand-400" />
          <span>Files</span>
        </span>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleOpenCreateModal('file')}
            title="New File in Root"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-850 transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleOpenCreateModal('folder')}
            title="New Folder in Root"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-850 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tree list */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {files.length > 0 ? (
          files.map((file) => (
            <FileTreeNode
              key={file.id}
              node={file}
              activeFileId={activeFileId}
              onSelectFile={onSelectFile}
              onToggleFolder={onToggleFolder}
              onDeleteNode={onDeleteNode}
              onRenameNode={onRenameNode}
              onOpenCreateModal={(type, parentId, parentName) =>
                handleOpenCreateModal(type, parentId, parentName)
              }
            />
          ))
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            <p>No files in project.</p>
            <button
              onClick={() => handleOpenCreateModal('file')}
              className="mt-2 text-brand-400 hover:text-brand-300 underline"
            >
              Add a file
            </button>
          </div>
        )}
      </div>

      {/* Create item modal */}
      <CreateItemModal
        isOpen={modalState.isOpen}
        itemType={modalState.type}
        parentFolderId={modalState.parentFolderId}
        parentFolderName={modalState.parentFolderName}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        onCreate={onCreateItem}
      />
    </aside>
  );
};
