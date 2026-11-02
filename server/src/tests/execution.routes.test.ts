import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// ─── IDs used throughout ──────────────────────────────────────────────────────
const OWNER_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const OTHER_ID = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const PROJECT_ID = 'cccccccccccccccccccccccc';

// ─── Mock User model ─────────────────────────────────────────────────────────
vi.mock('../models/User', () => ({
  User: {
    findOne: vi.fn(),
    findById: vi.fn(),
  },
}));

// ─── Mock Project model ────────────────────────────────────────────────────────
vi.mock('../models/Project', () => ({
  Project: {
    find: vi.fn(),
    findById: vi.fn(),
  },
}));

// ─── Mock mongoose ────────────────────────────────────────────────────────────
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

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────
import app from '../server';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { authService } from '../services/auth.service';
import { executionService } from '../services/execution.service';

function buildMockUser(id = OWNER_ID) {
  return {
    _id: { toString: () => id },
    id,
    name: 'Alice',
    email: 'alice@devnest.dev',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toSafeObject: vi.fn().mockReturnValue({
      id,
      name: 'Alice',
      email: 'alice@devnest.dev',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  };
}

function buildMockProject(ownerId = OWNER_ID) {
  return {
    _id: { toString: () => PROJECT_ID },
    title: 'Test Project',
    description: 'Test description',
    language: 'python',
    owner: { toString: () => ownerId },
    rootFiles: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    toSafeObject: vi.fn().mockReturnValue({
      id: PROJECT_ID,
      title: 'Test Project',
      description: 'Test description',
      language: 'python',
      ownerId,
      rootFiles: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
  };
}

function authCookie(userId = OWNER_ID): string {
  const token = authService.signToken(userId);
  return `devnest_token=${token}`;
}

describe('POST /api/execute Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (User.findById as any).mockResolvedValue(buildMockUser());
  });

  describe('Authentication', () => {
    it('returns 401 when no session cookie or token is provided', async () => {
      const res = await request(app)
        .post('/api/execute')
        .send({
          language: 'python',
          sourceCode: 'print(1)',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('returns 401 when token is invalid', async () => {
      const res = await request(app)
        .post('/api/execute')
        .set('Cookie', 'devnest_token=invalid_garbage_token')
        .send({
          language: 'python',
          sourceCode: 'print(1)',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('Validation', () => {
    it('returns 400 when language is missing', async () => {
      const res = await request(app)
        .post('/api/execute')
        .set('Cookie', authCookie())
        .send({
          sourceCode: 'print(1)',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });

    it('returns 400 when language is not supported', async () => {
      const res = await request(app)
        .post('/api/execute')
        .set('Cookie', authCookie())
        .send({
          language: 'ruby',
          sourceCode: 'puts "hello"',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
      expect(res.body.message).toContain('Language must be one of');
    });

    it('returns 400 when sourceCode is missing', async () => {
      const res = await request(app)
        .post('/api/execute')
        .set('Cookie', authCookie())
        .send({
          language: 'python',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });

    it('returns 400 when sourceCode is empty string', async () => {
      const res = await request(app)
        .post('/api/execute')
        .set('Cookie', authCookie())
        .send({
          language: 'python',
          sourceCode: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Source code cannot be empty');
    });

    it('returns 400 when sourceCode exceeds 100KB limit', async () => {
      const hugeCode = 'a'.repeat(100001);
      const res = await request(app)
        .post('/api/execute')
        .set('Cookie', authCookie())
        .send({
          language: 'python',
          sourceCode: hugeCode,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('100KB');
    });
  });

  describe('Project Ownership & Execution', () => {
    it('returns 404 when projectId does not belong to requesting user', async () => {
      (Project.findById as any).mockResolvedValue(buildMockProject(OTHER_ID));

      const res = await request(app)
        .post('/api/execute')
        .set('Cookie', authCookie(OWNER_ID))
        .send({
          language: 'python',
          sourceCode: 'print(1)',
          projectId: PROJECT_ID,
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });

    it('returns 200 with normalized result on successful execution', async () => {
      (Project.findById as any).mockResolvedValue(buildMockProject(OWNER_ID));

      const mockExecuteSpy = vi.spyOn(executionService, 'execute').mockResolvedValue({
        stdout: 'Hello World\n',
        stderr: null,
        compileOutput: null,
        telemetry: {
          timeMs: 25,
          memoryKb: 4096,
          exitCode: 0,
          status: 'success',
          statusDescription: 'Execution completed successfully',
        },
      });

      const res = await request(app)
        .post('/api/execute')
        .set('Cookie', authCookie(OWNER_ID))
        .send({
          language: 'python',
          sourceCode: 'print("Hello World")',
          projectId: PROJECT_ID,
        });

      expect(res.status).toBe(200);
      expect(res.body.stdout).toBe('Hello World\n');
      expect(res.body.telemetry.status).toBe('success');
      expect(res.body.telemetry.exitCode).toBe(0);
      expect(mockExecuteSpy).toHaveBeenCalledTimes(1);
    });

    it('returns 200 with runtime error details when code execution fails', async () => {
      vi.spyOn(executionService, 'execute').mockResolvedValue({
        stdout: null,
        stderr: 'ZeroDivisionError: division by zero',
        compileOutput: null,
        telemetry: {
          timeMs: 12,
          memoryKb: 3072,
          exitCode: 1,
          status: 'runtime_error',
          statusDescription: 'Process exited with code 1',
        },
      });

      const res = await request(app)
        .post('/api/execute')
        .set('Cookie', authCookie(OWNER_ID))
        .send({
          language: 'python',
          sourceCode: '1 / 0',
        });

      expect(res.status).toBe(200);
      expect(res.body.stderr).toContain('ZeroDivisionError');
      expect(res.body.telemetry.status).toBe('runtime_error');
      expect(res.body.telemetry.exitCode).toBe(1);
    });

    it('returns 200 with timeout details when code execution times out', async () => {
      vi.spyOn(executionService, 'execute').mockResolvedValue({
        stdout: null,
        stderr: 'Execution timed out',
        compileOutput: null,
        telemetry: {
          timeMs: null,
          memoryKb: null,
          exitCode: 124,
          status: 'time_limit_exceeded',
          statusDescription: 'Time limit exceeded',
        },
      });

      const res = await request(app)
        .post('/api/execute')
        .set('Cookie', authCookie(OWNER_ID))
        .send({
          language: 'python',
          sourceCode: 'while True: pass',
        });

      expect(res.status).toBe(200);
      expect(res.body.telemetry.status).toBe('time_limit_exceeded');
      expect(res.body.telemetry.exitCode).toBe(124);
    });
  });
});
