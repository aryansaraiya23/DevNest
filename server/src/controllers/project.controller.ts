import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  createProjectSchema,
  renameProjectSchema,
  updateFilesSchema,
} from '../validators/project.validator';
import {
  projectService,
  ProjectNotFoundError,
  ProjectForbiddenError,
} from '../services/project.service';

export class ProjectController {
  /**
   * GET /api/projects
   * Lists all projects owned by the authenticated user.
   */
  public async list(req: Request, res: Response): Promise<void> {
    try {
      const projects = await projectService.getProjectsByOwner(req.user!.id);
      res.status(200).json({ projects });
    } catch (err) {
      console.error('[List Projects Error]', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to load projects. Please try again.',
      });
    }
  }

  /**
   * GET /api/projects/:id
   * Returns a single project. Enforces ownership.
   */
  public async getOne(req: Request, res: Response): Promise<void> {
    try {
      const project = await projectService.getProjectById(req.params.id, req.user!.id);
      res.status(200).json({ project });
    } catch (err) {
      if (err instanceof ProjectNotFoundError) {
        res.status(404).json({ error: 'Not Found', message: err.message });
        return;
      }
      if (err instanceof ProjectForbiddenError) {
        // Return 404 (not 403) to avoid leaking resource existence to other users
        res.status(404).json({ error: 'Not Found', message: 'Project not found.' });
        return;
      }
      console.error('[Get Project Error]', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to load project. Please try again.',
      });
    }
  }

  /**
   * POST /api/projects
   * Creates a new project for the authenticated user.
   */
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createProjectSchema.parse(req.body);
      const project = await projectService.createProject(parsed, req.user!.id);
      res.status(201).json({ message: 'Project created successfully.', project });
    } catch (err) {
      if (err instanceof ZodError) {
        const firstError = err.issues[0]?.message || 'Invalid input data.';
        res.status(400).json({
          error: 'Validation Error',
          message: firstError,
          details: err.issues.map((e) => ({ field: e.path.map(String).join('.'), message: e.message })),
        });
        return;
      }
      console.error('[Create Project Error]', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create project. Please try again.',
      });
    }
  }

  /**
   * PATCH /api/projects/:id/rename
   * Renames a project. Enforces ownership.
   */
  public async rename(req: Request, res: Response): Promise<void> {
    try {
      const parsed = renameProjectSchema.parse(req.body);
      const project = await projectService.renameProject(req.params.id, parsed, req.user!.id);
      res.status(200).json({ message: 'Project renamed successfully.', project });
    } catch (err) {
      if (err instanceof ZodError) {
        const firstError = err.issues[0]?.message || 'Invalid input data.';
        res.status(400).json({ error: 'Validation Error', message: firstError });
        return;
      }
      if (err instanceof ProjectNotFoundError) {
        res.status(404).json({ error: 'Not Found', message: err.message });
        return;
      }
      if (err instanceof ProjectForbiddenError) {
        res.status(404).json({ error: 'Not Found', message: 'Project not found.' });
        return;
      }
      console.error('[Rename Project Error]', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to rename project. Please try again.',
      });
    }
  }

  /**
   * DELETE /api/projects/:id
   * Deletes a project. Enforces ownership.
   */
  public async delete(req: Request, res: Response): Promise<void> {
    try {
      await projectService.deleteProject(req.params.id, req.user!.id);
      res.status(200).json({ message: 'Project deleted successfully.' });
    } catch (err) {
      if (err instanceof ProjectNotFoundError) {
        res.status(404).json({ error: 'Not Found', message: err.message });
        return;
      }
      if (err instanceof ProjectForbiddenError) {
        res.status(404).json({ error: 'Not Found', message: 'Project not found.' });
        return;
      }
      console.error('[Delete Project Error]', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete project. Please try again.',
      });
    }
  }

  /**
   * PUT /api/projects/:id/files
   * Replaces the full file tree for a project (IDE save).
   * Enforces ownership.
   */
  public async updateFiles(req: Request, res: Response): Promise<void> {
    try {
      const parsed = updateFilesSchema.parse(req.body);
      const project = await projectService.updateProjectFiles(req.params.id, parsed, req.user!.id);
      res.status(200).json({ message: 'Files saved successfully.', project });
    } catch (err) {
      if (err instanceof ZodError) {
        const firstError = err.issues[0]?.message || 'Invalid file tree data.';
        res.status(400).json({ error: 'Validation Error', message: firstError });
        return;
      }
      if (err instanceof ProjectNotFoundError) {
        res.status(404).json({ error: 'Not Found', message: err.message });
        return;
      }
      if (err instanceof ProjectForbiddenError) {
        res.status(404).json({ error: 'Not Found', message: 'Project not found.' });
        return;
      }
      console.error('[Update Files Error]', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to save files. Please try again.',
      });
    }
  }

  /**
   * PATCH /api/projects/:id/language
   * Updates the primary language of a project. Enforces ownership.
   */
  public async updateLanguage(req: Request, res: Response): Promise<void> {
    try {
      const { language } = req.body;
      if (!language || typeof language !== 'string') {
        res.status(400).json({ error: 'Validation Error', message: 'Language is required.' });
        return;
      }
      const project = await projectService.updateProjectLanguage(req.params.id, language, req.user!.id);
      res.status(200).json({ message: 'Language updated successfully.', project });
    } catch (err) {
      if (err instanceof ProjectNotFoundError) {
        res.status(404).json({ error: 'Not Found', message: err.message });
        return;
      }
      if (err instanceof ProjectForbiddenError) {
        res.status(404).json({ error: 'Not Found', message: 'Project not found.' });
        return;
      }
      if (err instanceof Error && err.message.startsWith('Unsupported language')) {
        res.status(400).json({ error: 'Validation Error', message: err.message });
        return;
      }
      console.error('[Update Language Error]', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update language. Please try again.',
      });
    }
  }
}

export const projectController = new ProjectController();
