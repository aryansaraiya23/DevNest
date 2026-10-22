import { SupportedLanguage } from './language';

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  isEntry?: boolean;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  language: SupportedLanguage;
  ownerId: string;
  files: ProjectFile[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDTO {
  title: string;
  description?: string;
  language: SupportedLanguage;
}

export interface UpdateProjectDTO {
  title?: string;
  description?: string;
}

export interface UpdateFileDTO {
  path: string;
  content: string;
}
