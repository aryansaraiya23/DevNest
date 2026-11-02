import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { executeCodeSchema } from '../validators/execution.validator';
import { executionService, ExecutionConfigError } from '../services/execution.service';
import { ProjectNotFoundError, ProjectForbiddenError } from '../services/project.service';

export class ExecutionController {
  /**
   * POST /api/execute
   * Executes code using OnlineCompiler.io sandbox.
   * Requires authentication. Enforces project ownership if projectId is provided.
   */
  public async execute(req: Request, res: Response): Promise<void> {
    try {
      const parsed = executeCodeSchema.parse(req.body);
      const result = await executionService.execute(parsed, req.user!.id);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof ZodError) {
        const firstError = err.issues[0]?.message || 'Invalid execution request.';
        res.status(400).json({
          error: 'Validation Error',
          message: firstError,
          details: err.issues.map((e) => ({
            field: e.path.map(String).join('.'),
            message: e.message,
          })),
        });
        return;
      }

      if (err instanceof ProjectNotFoundError || err instanceof ProjectForbiddenError) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Project not found.',
        });
        return;
      }

      if (err instanceof ExecutionConfigError) {
        res.status(500).json({
          error: 'Configuration Error',
          message: err.message,
        });
        return;
      }

      console.error('[Execution Error]', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to execute code. Please try again.',
      });
    }
  }
}

export const executionController = new ExecutionController();
