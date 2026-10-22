import { WorkspaceProject, CreateProjectForm } from '../types/project';
import { FileNode } from '../types/files';
import { INITIAL_MOCK_PROJECTS } from '../data/mockData';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@devnest/shared';

const PROJECTS_STORAGE_KEY = 'devnest_mock_projects';

class MockProjectService {
  private projects: WorkspaceProject[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (stored) {
        this.projects = JSON.parse(stored);
      } else {
        this.projects = [...INITIAL_MOCK_PROJECTS];
        this.persist();
      }
    } catch {
      this.projects = [...INITIAL_MOCK_PROJECTS];
    }
  }

  private persist() {
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(this.projects));
    } catch (e) {
      console.warn('[DevNest Projects] Failed to persist projects', e);
    }
  }

  public async getProjects(): Promise<WorkspaceProject[]> {
    return [...this.projects];
  }

  public async getProjectById(id: string): Promise<WorkspaceProject | null> {
    const proj = this.projects.find((p) => p.id === id);
    return proj ? JSON.parse(JSON.stringify(proj)) : null;
  }

  public async createProject(
    form: CreateProjectForm,
    ownerId: string,
    ownerName: string
  ): Promise<WorkspaceProject> {
    const langConfig = SUPPORTED_LANGUAGES[form.language];
    const initialEntryFileName = langConfig ? langConfig.defaultFileName : 'main.txt';
    const boilerplate = langConfig ? langConfig.boilerplate : '// DevNest Code File\n';

    const defaultFiles: FileNode[] = [
      {
        id: `file_${Date.now()}_entry`,
        name: initialEntryFileName,
        path: initialEntryFileName,
        type: 'file',
        isEntry: true,
        content: boilerplate,
      },
      {
        id: `file_${Date.now()}_readme`,
        name: 'README.md',
        path: 'README.md',
        type: 'file',
        content: `# ${form.title}\n\n${form.description || 'DevNest workspace project.'}\n`,
      },
    ];

    const newProject: WorkspaceProject = {
      id: `proj_${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      language: form.language,
      ownerId,
      ownerName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rootFiles: defaultFiles,
    };

    this.projects.unshift(newProject);
    this.persist();
    return newProject;
  }

  public async renameProject(id: string, newTitle: string): Promise<WorkspaceProject> {
    const index = this.projects.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Project not found');

    this.projects[index] = {
      ...this.projects[index],
      title: newTitle.trim(),
      updatedAt: new Date().toISOString(),
    };

    this.persist();
    return this.projects[index];
  }

  public async deleteProject(id: string): Promise<void> {
    this.projects = this.projects.filter((p) => p.id !== id);
    this.persist();
  }

  public async updateProjectFiles(projectId: string, files: FileNode[]): Promise<void> {
    const proj = this.projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found');

    proj.rootFiles = files;
    proj.updatedAt = new Date().toISOString();
    this.persist();
  }

  public async updateProjectLanguage(projectId: string, language: SupportedLanguage): Promise<void> {
    const proj = this.projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found');

    proj.language = language;
    proj.updatedAt = new Date().toISOString();
    this.persist();
  }
}

export const mockProjectService = new MockProjectService();

// ==========================================
// File Tree Pure Helper Functions
// ==========================================

export function findNodeById(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function updateNodeContent(nodes: FileNode[], id: string, newContent: string): FileNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, content: newContent };
    }
    if (node.children) {
      return { ...node, children: updateNodeContent(node.children, id, newContent) };
    }
    return node;
  });
}

export function toggleFolderState(nodes: FileNode[], folderId: string): FileNode[] {
  return nodes.map((node) => {
    if (node.id === folderId) {
      return { ...node, isOpen: !node.isOpen };
    }
    if (node.children) {
      return { ...node, children: toggleFolderState(node.children, folderId) };
    }
    return node;
  });
}

export function addNodeToTree(
  nodes: FileNode[],
  parentFolderId: string | null,
  newNode: FileNode
): FileNode[] {
  if (!parentFolderId) {
    return [...nodes, newNode];
  }

  return nodes.map((node) => {
    if (node.id === parentFolderId && node.type === 'folder') {
      const currentChildren = node.children || [];
      return {
        ...node,
        isOpen: true,
        children: [...currentChildren, newNode],
      };
    }
    if (node.children) {
      return {
        ...node,
        children: addNodeToTree(node.children, parentFolderId, newNode),
      };
    }
    return node;
  });
}

export function deleteNodeFromTree(nodes: FileNode[], nodeId: string): FileNode[] {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => {
      if (node.children) {
        return {
          ...node,
          children: deleteNodeFromTree(node.children, nodeId),
        };
      }
      return node;
    });
}

export function renameNodeInTree(nodes: FileNode[], nodeId: string, newName: string): FileNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      const parts = node.path.split('/');
      parts[parts.length - 1] = newName;
      return {
        ...node,
        name: newName,
        path: parts.join('/'),
      };
    }
    if (node.children) {
      return {
        ...node,
        children: renameNodeInTree(node.children, nodeId, newName),
      };
    }
    return node;
  });
}

export function detectMonacoLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'mjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
    case 'h':
      return 'cpp';
    case 'java':
      return 'java';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
}
