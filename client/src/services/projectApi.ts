import { WorkspaceProject, CreateProjectForm } from '../types/project';
import { FileNode } from '../types/files';
import { SupportedLanguage } from '@devnest/shared';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

// ─── Shared fetch helper (mirrors authApi.ts pattern) ────────────────────────

function readErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const body = data as { message?: unknown; error?: unknown; details?: { message?: string }[] };
  if (typeof body.message === 'string' && body.message.trim()) return body.message;
  const firstDetail = body.details?.[0]?.message;
  if (typeof firstDetail === 'string' && firstDetail.trim()) return firstDetail;
  if (typeof body.error === 'string' && body.error.trim()) return body.error;
  return fallback;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new Error('Unable to reach the DevNest server. Please try again.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(readErrorMessage(data, `Request failed with status ${res.status}`));
  }

  return data as T;
}

// ─── Response shapes from the server ─────────────────────────────────────────

interface ServerProject {
  id: string;
  title: string;
  description: string;
  language: SupportedLanguage;
  ownerId: string;
  rootFiles: FileNode[];
  createdAt: string;
  updatedAt: string;
}

function toWorkspaceProject(p: ServerProject): WorkspaceProject {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    language: p.language,
    ownerId: p.ownerId,
    // ownerName is not stored in DB; we use a placeholder here.
    // It could be populated from the auth user in a future pass.
    ownerName: '',
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    rootFiles: p.rootFiles,
  };
}

// ─── ProjectApiService ────────────────────────────────────────────────────────

class ProjectApiService {
  /**
   * Fetches all projects owned by the authenticated user.
   */
  async getProjects(): Promise<WorkspaceProject[]> {
    const { projects } = await apiFetch<{ projects: ServerProject[] }>('/projects');
    return projects.map(toWorkspaceProject);
  }

  /**
   * Fetches a single project by ID. Returns null if not found or forbidden.
   */
  async getProjectById(id: string): Promise<WorkspaceProject | null> {
    try {
      const { project } = await apiFetch<{ project: ServerProject }>(`/projects/${id}`);
      return toWorkspaceProject(project);
    } catch {
      return null;
    }
  }

  /**
   * Creates a new project. The server seeds the initial boilerplate file tree.
   */
  async createProject(
    form: CreateProjectForm,
    _ownerId: string,
    _ownerName: string
  ): Promise<WorkspaceProject> {
    const { project } = await apiFetch<{ project: ServerProject }>('/projects', {
      method: 'POST',
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        language: form.language,
      }),
    });
    return toWorkspaceProject(project);
  }

  /**
   * Renames a project.
   */
  async renameProject(id: string, newTitle: string): Promise<WorkspaceProject> {
    const { project } = await apiFetch<{ project: ServerProject }>(`/projects/${id}/rename`, {
      method: 'PATCH',
      body: JSON.stringify({ title: newTitle }),
    });
    return toWorkspaceProject(project);
  }

  /**
   * Deletes a project.
   */
  async deleteProject(id: string): Promise<void> {
    await apiFetch<{ message: string }>(`/projects/${id}`, { method: 'DELETE' });
  }

  /**
   * Persists the full file tree for a project (IDE save).
   */
  async updateProjectFiles(projectId: string, files: FileNode[]): Promise<void> {
    await apiFetch<{ message: string }>(`/projects/${projectId}/files`, {
      method: 'PUT',
      body: JSON.stringify({ rootFiles: files }),
    });
  }

  /**
   * Updates the primary language of a project.
   */
  async updateProjectLanguage(projectId: string, language: SupportedLanguage): Promise<void> {
    await apiFetch<{ message: string }>(`/projects/${projectId}/language`, {
      method: 'PATCH',
      body: JSON.stringify({ language }),
    });
  }
}

export const projectApiService = new ProjectApiService();
