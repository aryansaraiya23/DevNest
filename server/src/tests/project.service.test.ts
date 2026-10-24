/**
 * Unit tests for ProjectService.
 * MongoDB is fully mocked — no real DB connection needed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectService, ProjectNotFoundError, ProjectForbiddenError } from '../services/project.service';

// ─── Mock mongoose ─────────────────────────────────────────────────────────────
vi.mock('mongoose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('mongoose')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      isValidObjectId: vi.fn().mockReturnValue(true),
      Types: actual.default.Types,
    },
  };
});

// ─── Mock Project model ────────────────────────────────────────────────────────
const OWNER_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa'; // 24-char hex
const OTHER_ID = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const PROJECT_ID = 'cccccccccccccccccccccccc';

function buildMockProject(overrides: Record<string, unknown> = {}) {
  const base = {
    _id: { toString: () => PROJECT_ID },
    title: 'Test Project',
    description: 'A test project',
    language: 'cpp',
    owner: { toString: () => OWNER_ID },
    rootFiles: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    save: vi.fn().mockResolvedValue(undefined),
    deleteOne: vi.fn().mockResolvedValue(undefined),
    toSafeObject: vi.fn().mockReturnValue({
      id: PROJECT_ID,
      title: 'Test Project',
      description: 'A test project',
      language: 'cpp',
      ownerId: OWNER_ID,
      rootFiles: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
    ...overrides,
  };
  return base;
}

vi.mock('../models/Project', () => ({
  Project: {
    find: vi.fn(),
    findById: vi.fn(),
  },
}));

import { Project } from '../models/Project';
import mongoose from 'mongoose';

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('ProjectService', () => {
  let service: ProjectService;

  beforeEach(() => {
    service = new ProjectService();
    vi.clearAllMocks();
    vi.mocked(mongoose.isValidObjectId).mockReturnValue(true);
  });

  // ── getProjectsByOwner ────────────────────────────────────────────────────
  describe('getProjectsByOwner()', () => {
    it('returns an array of safe project objects', async () => {
      const mockProject = buildMockProject();
      vi.mocked(Project.find).mockReturnValue({
        sort: vi.fn().mockResolvedValue([mockProject]),
      } as any);

      const result = await service.getProjectsByOwner(OWNER_ID);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].id).toBe(PROJECT_ID);
      expect(result[0].ownerId).toBe(OWNER_ID);
    });

    it('returns an empty array when no projects exist', async () => {
      vi.mocked(Project.find).mockReturnValue({
        sort: vi.fn().mockResolvedValue([]),
      } as any);

      const result = await service.getProjectsByOwner(OWNER_ID);
      expect(result).toHaveLength(0);
    });
  });

  // ── getProjectById ────────────────────────────────────────────────────────
  describe('getProjectById()', () => {
    it('returns safe project for the correct owner', async () => {
      vi.mocked(Project.findById).mockResolvedValue(buildMockProject() as any);

      const result = await service.getProjectById(PROJECT_ID, OWNER_ID);
      expect(result.id).toBe(PROJECT_ID);
    });

    it('throws ProjectNotFoundError when project does not exist', async () => {
      vi.mocked(Project.findById).mockResolvedValue(null);

      await expect(service.getProjectById(PROJECT_ID, OWNER_ID)).rejects.toThrow(ProjectNotFoundError);
    });

    it('throws ProjectForbiddenError when project belongs to another user (IDOR prevention)', async () => {
      vi.mocked(Project.findById).mockResolvedValue(buildMockProject() as any);

      // OTHER_ID is not the owner
      await expect(service.getProjectById(PROJECT_ID, OTHER_ID)).rejects.toThrow(ProjectForbiddenError);
    });

    it('throws ProjectNotFoundError for an invalid ObjectId', async () => {
      vi.mocked(mongoose.isValidObjectId).mockReturnValue(false);

      await expect(service.getProjectById('not-an-id', OWNER_ID)).rejects.toThrow(ProjectNotFoundError);
    });
  });

  // ── renameProject ─────────────────────────────────────────────────────────
  describe('renameProject()', () => {
    it('renames the project and returns updated safe object', async () => {
      const mock = buildMockProject();
      vi.mocked(Project.findById).mockResolvedValue(mock as any);

      await service.renameProject(PROJECT_ID, { title: 'New Name' }, OWNER_ID);

      expect(mock.save).toHaveBeenCalledOnce();
    });

    it('throws ProjectForbiddenError when another user tries to rename', async () => {
      vi.mocked(Project.findById).mockResolvedValue(buildMockProject() as any);

      await expect(
        service.renameProject(PROJECT_ID, { title: 'Hacked' }, OTHER_ID)
      ).rejects.toThrow(ProjectForbiddenError);
    });

    it('throws ProjectNotFoundError when project does not exist', async () => {
      vi.mocked(Project.findById).mockResolvedValue(null);

      await expect(
        service.renameProject(PROJECT_ID, { title: 'New' }, OWNER_ID)
      ).rejects.toThrow(ProjectNotFoundError);
    });
  });

  // ── deleteProject ─────────────────────────────────────────────────────────
  describe('deleteProject()', () => {
    it('deletes the project when owner requests it', async () => {
      const mock = buildMockProject();
      vi.mocked(Project.findById).mockResolvedValue(mock as any);

      await service.deleteProject(PROJECT_ID, OWNER_ID);

      expect(mock.deleteOne).toHaveBeenCalledOnce();
    });

    it('throws ProjectForbiddenError when another user tries to delete (IDOR prevention)', async () => {
      vi.mocked(Project.findById).mockResolvedValue(buildMockProject() as any);

      await expect(service.deleteProject(PROJECT_ID, OTHER_ID)).rejects.toThrow(ProjectForbiddenError);
    });

    it('throws ProjectNotFoundError when project does not exist', async () => {
      vi.mocked(Project.findById).mockResolvedValue(null);

      await expect(service.deleteProject(PROJECT_ID, OWNER_ID)).rejects.toThrow(ProjectNotFoundError);
    });
  });

  // ── updateProjectFiles ────────────────────────────────────────────────────
  describe('updateProjectFiles()', () => {
    it('saves the file tree and returns the updated project', async () => {
      const mock = buildMockProject();
      vi.mocked(Project.findById).mockResolvedValue(mock as any);

      const files = [
        { id: 'f1', name: 'main.cpp', path: 'main.cpp', type: 'file' as const, content: '// code' },
      ];

      await service.updateProjectFiles(PROJECT_ID, { rootFiles: files }, OWNER_ID);

      expect(mock.save).toHaveBeenCalledOnce();
    });

    it('throws ProjectForbiddenError when another user tries to update files', async () => {
      vi.mocked(Project.findById).mockResolvedValue(buildMockProject() as any);

      await expect(
        service.updateProjectFiles(PROJECT_ID, { rootFiles: [] }, OTHER_ID)
      ).rejects.toThrow(ProjectForbiddenError);
    });
  });
});
