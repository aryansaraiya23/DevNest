import { SupportedLanguage } from '@devnest/shared';
import { FileNode } from './files';

export interface ProjectMetadata {
  id: string;
  title: string;
  description: string;
  language: SupportedLanguage;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceProject extends ProjectMetadata {
  rootFiles: FileNode[];
}

export interface CreateProjectForm {
  title: string;
  description: string;
  language: SupportedLanguage;
}
