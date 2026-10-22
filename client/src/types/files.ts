export type FileSystemItemType = 'file' | 'folder';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: FileSystemItemType;
  content?: string;
  children?: FileNode[];
  isOpen?: boolean; // For folders
  isEntry?: boolean;
}

export interface OpenTab {
  fileId: string;
  filePath: string;
  fileName: string;
  isDirty: boolean;
  language: string;
}

export interface EditorCursorPosition {
  lineNumber: number;
  column: number;
}
