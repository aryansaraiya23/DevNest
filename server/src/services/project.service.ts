import mongoose from 'mongoose';
import { Project, IFileNode, SafeProject } from '../models/Project';
import { CreateProjectInput, RenameProjectInput, UpdateFilesInput } from '../validators/project.validator';
import { SUPPORTED_LANGUAGES } from '@devnest/shared';

// ─── Domain error classes ─────────────────────────────────────────────────────

export class ProjectNotFoundError extends Error {
  constructor(message = 'Project not found.') {
    super(message);
    this.name = 'ProjectNotFoundError';
  }
}

export class ProjectForbiddenError extends Error {
  constructor(message = 'You do not have permission to access this project.') {
    super(message);
    this.name = 'ProjectForbiddenError';
  }
}

// ─── ProjectService ───────────────────────────────────────────────────────────

export class ProjectService {
  /**
   * Returns all projects owned by the given user, sorted newest-first.
   */
  public async getProjectsByOwner(ownerId: string): Promise<SafeProject[]> {
    const projects = await Project.find({ owner: ownerId }).sort({ updatedAt: -1 });
    return projects.map((p) => p.toSafeObject());
  }

  /**
   * Returns a single project. Throws if not found or if the requesting user
   * is not the owner (prevents IDOR).
   */
  public async getProjectById(projectId: string, requestingUserId: string): Promise<SafeProject> {
    if (!mongoose.isValidObjectId(projectId)) {
      throw new ProjectNotFoundError();
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ProjectNotFoundError();
    }

    if (project.owner.toString() !== requestingUserId) {
      throw new ProjectForbiddenError();
    }

    return project.toSafeObject();
  }

  /**
   * Creates a new project with a boilerplate entry file and README.
   */
  public async createProject(
    input: CreateProjectInput,
    ownerId: string
  ): Promise<SafeProject> {
    const langConfig = SUPPORTED_LANGUAGES[input.language];
    const entryFileName = langConfig.defaultFileName;
    const boilerplate = langConfig.boilerplate;

    const rootFiles: IFileNode[] = [
      {
        id: `file_${Date.now()}_entry`,
        name: entryFileName,
        path: entryFileName,
        type: 'file',
        isEntry: true,
        content: boilerplate,
      },
      {
        id: `file_${Date.now()}_readme`,
        name: 'README.md',
        path: 'README.md',
        type: 'file',
        content: `# ${input.title}\n\n${input.description || 'DevNest workspace project.'}\n`,
      },
    ];

    const project = new Project({
      title: input.title,
      description: input.description ?? '',
      language: input.language,
      owner: new mongoose.Types.ObjectId(ownerId),
      rootFiles,
    });

    await project.save();
    return project.toSafeObject();
  }

  /**
   * Renames a project. Ownership is enforced before any mutation.
   */
  public async renameProject(
    projectId: string,
    input: RenameProjectInput,
    requestingUserId: string
  ): Promise<SafeProject> {
    if (!mongoose.isValidObjectId(projectId)) {
      throw new ProjectNotFoundError();
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ProjectNotFoundError();
    }

    if (project.owner.toString() !== requestingUserId) {
      throw new ProjectForbiddenError();
    }

    project.title = input.title;
    await project.save();

    return project.toSafeObject();
  }

  /**
   * Deletes a project. Ownership is enforced before deletion.
   */
  public async deleteProject(projectId: string, requestingUserId: string): Promise<void> {
    if (!mongoose.isValidObjectId(projectId)) {
      throw new ProjectNotFoundError();
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ProjectNotFoundError();
    }

    if (project.owner.toString() !== requestingUserId) {
      throw new ProjectForbiddenError();
    }

    await project.deleteOne();
  }

  /**
   * Replaces the entire file tree for a project (used for save from IDE).
   * Ownership is enforced before any mutation.
   */
  public async updateProjectFiles(
    projectId: string,
    input: UpdateFilesInput,
    requestingUserId: string
  ): Promise<SafeProject> {
    if (!mongoose.isValidObjectId(projectId)) {
      throw new ProjectNotFoundError();
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ProjectNotFoundError();
    }

    if (project.owner.toString() !== requestingUserId) {
      throw new ProjectForbiddenError();
    }

    project.rootFiles = input.rootFiles as IFileNode[];
    await project.save();

    return project.toSafeObject();
  }

  /**
   * Updates only the language field of a project.
   * Ownership is enforced before any mutation.
   */
  public async updateProjectLanguage(
    projectId: string,
    language: string,
    requestingUserId: string
  ): Promise<SafeProject> {
    if (!mongoose.isValidObjectId(projectId)) {
      throw new ProjectNotFoundError();
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ProjectNotFoundError();
    }

    if (project.owner.toString() !== requestingUserId) {
      throw new ProjectForbiddenError();
    }

    const validLanguages = ['javascript', 'python', 'cpp', 'java'];
    if (!validLanguages.includes(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    project.language = language as any;
    await project.save();

    return project.toSafeObject();
  }
}

export const projectService = new ProjectService();
