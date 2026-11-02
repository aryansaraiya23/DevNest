import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExecutionService, ExecutionConfigError } from '../services/execution.service';
import { projectService, ProjectNotFoundError, ProjectForbiddenError } from '../services/project.service';

describe('ExecutionService Unit Tests', () => {
  let service: ExecutionService;
  const mockApiKey = 'test_api_key_12345';
  const mockBaseUrl = 'https://api.onlinecompiler.io';

  beforeEach(() => {
    service = new ExecutionService(mockApiKey, mockBaseUrl);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolveCompilerId', () => {
    it('maps all supported languages to correct OnlineCompiler.io compiler IDs', () => {
      expect(service.resolveCompilerId('javascript')).toBe('nodejs-24');
      expect(service.resolveCompilerId('python')).toBe('python-3.14');
      expect(service.resolveCompilerId('cpp')).toBe('g++-15');
      expect(service.resolveCompilerId('java')).toBe('openjdk-25');
    });

    it('throws error for unsupported language', () => {
      // @ts-expect-error testing invalid language
      expect(() => service.resolveCompilerId('rust')).toThrow('Unsupported language');
    });
  });

  describe('normalizeResult', () => {
    it('normalizes a successful run', () => {
      const result = service.normalizeResult(
        {
          output: 'Hello, World!\n',
          error: '',
          status: 'success',
          exit_code: 0,
          signal: null,
          time: '0.0248',
          total: '0.0330',
          memory: '8192',
        },
        'python'
      );

      expect(result.stdout).toBe('Hello, World!\n');
      expect(result.stderr).toBeNull();
      expect(result.compileOutput).toBeNull();
      expect(result.telemetry.status).toBe('success');
      expect(result.telemetry.exitCode).toBe(0);
      expect(result.telemetry.timeMs).toBe(33); // 0.0330s * 1000
      expect(result.telemetry.memoryKb).toBe(8192);
      expect(result.telemetry.statusDescription).toBe('Execution completed successfully');
    });

    it('normalizes time limit exceeded (exit_code 124)', () => {
      const result = service.normalizeResult(
        {
          output: '',
          error: 'Time limit exceeded',
          status: 'error',
          exit_code: 124,
          signal: null,
          time: '10.0000',
          total: '10.0000',
          memory: '4096',
        },
        'cpp'
      );

      expect(result.telemetry.status).toBe('time_limit_exceeded');
      expect(result.telemetry.exitCode).toBe(124);
      expect(result.telemetry.statusDescription).toBe('Time limit exceeded');
    });

    it('normalizes memory limit exceeded (exit_code 137)', () => {
      const result = service.normalizeResult(
        {
          output: '',
          error: 'Killed',
          status: 'error',
          exit_code: 137,
          signal: 9,
          time: '0.5000',
          total: '0.5000',
          memory: '131072',
        },
        'python'
      );

      expect(result.telemetry.status).toBe('memory_limit_exceeded');
      expect(result.telemetry.exitCode).toBe(137);
      expect(result.telemetry.statusDescription).toBe('Memory limit exceeded');
    });

    it('normalizes a compilation error in C++', () => {
      const result = service.normalizeResult(
        {
          output: '',
          error: 'main.cpp:3:5: error: expected primary-expression before return',
          status: 'error',
          exit_code: 1,
          signal: null,
          time: '0.0100',
          total: '0.0100',
          memory: '2048',
        },
        'cpp'
      );

      expect(result.telemetry.status).toBe('compilation_error');
      expect(result.telemetry.exitCode).toBe(1);
      expect(result.compileOutput).toContain('error:');
      expect(result.telemetry.statusDescription).toBe('Compilation error');
    });

    it('normalizes a runtime error', () => {
      const result = service.normalizeResult(
        {
          output: 'Starting calculation...\n',
          error: 'ZeroDivisionError: division by zero',
          status: 'error',
          exit_code: 1,
          signal: null,
          time: '0.0200',
          total: '0.0200',
          memory: '5120',
        },
        'python'
      );

      expect(result.stdout).toBe('Starting calculation...\n');
      expect(result.stderr).toContain('ZeroDivisionError');
      expect(result.telemetry.status).toBe('runtime_error');
      expect(result.telemetry.exitCode).toBe(1);
      expect(result.telemetry.statusDescription).toBe('Process exited with code 1');
    });
  });

  describe('execute', () => {
    it('throws ExecutionConfigError when API key is missing', async () => {
      const noKeyService = new ExecutionService('', mockBaseUrl);
      await expect(
        noKeyService.execute(
          {
            language: 'python',
            sourceCode: 'print(1)',
          },
          'user123'
        )
      ).rejects.toThrow(ExecutionConfigError);
    });

    it('successfully calls OnlineCompiler.io and normalizes response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          output: 'Hello DevNest!\n',
          error: '',
          status: 'success',
          exit_code: 0,
          signal: null,
          total: '0.015',
          memory: '2048',
        }),
      });
      global.fetch = mockFetch;

      const result = await service.execute(
        {
          language: 'python',
          sourceCode: 'print("Hello DevNest!")',
          stdin: 'sample_input',
        },
        'user123'
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.onlinecompiler.io/api/run-code-sync/');
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: mockApiKey,
      });

      const sentBody = JSON.parse(options.body);
      expect(sentBody).toEqual({
        compiler: 'python-3.14',
        code: 'print("Hello DevNest!")',
        input: 'sample_input',
        time_limit: 10,
      });

      expect(result.stdout).toBe('Hello DevNest!\n');
      expect(result.telemetry.status).toBe('success');
      expect(result.telemetry.timeMs).toBe(15);
    });

    it('verifies project ownership when projectId is provided', async () => {
      const getProjectSpy = vi
        .spyOn(projectService, 'getProjectById')
        .mockResolvedValue({
          id: 'proj123',
          title: 'My Project',
          description: '',
          language: 'python',
          ownerId: 'user123',
          rootFiles: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          output: 'verified\n',
          error: '',
          status: 'success',
          exit_code: 0,
        }),
      });

      const result = await service.execute(
        {
          language: 'python',
          sourceCode: 'print("test")',
          projectId: 'proj123',
        },
        'user123'
      );

      expect(getProjectSpy).toHaveBeenCalledWith('proj123', 'user123');
      expect(result.stdout).toBe('verified\n');
    });

    it('rejects if project is not owned by requesting user', async () => {
      vi.spyOn(projectService, 'getProjectById').mockRejectedValue(
        new ProjectForbiddenError()
      );

      await expect(
        service.execute(
          {
            language: 'python',
            sourceCode: 'print("test")',
            projectId: 'foreign_proj',
          },
          'attacker_user'
        )
      ).rejects.toThrow(ProjectForbiddenError);
    });

    it('handles provider 429 rate limit response gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Too many concurrent requests.' }),
      });

      const result = await service.execute(
        {
          language: 'python',
          sourceCode: 'print(1)',
        },
        'user123'
      );

      expect(result.telemetry.status).toBe('error');
      expect(result.stderr).toContain('rate limit');
    });

    it('handles network failure gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      const result = await service.execute(
        {
          language: 'python',
          sourceCode: 'print(1)',
        },
        'user123'
      );

      expect(result.telemetry.status).toBe('error');
      expect(result.stderr).toContain('Failed to reach execution provider');
    });

    it('handles timeout (AbortError) gracefully', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      global.fetch = vi.fn().mockRejectedValue(abortError);

      const result = await service.execute(
        {
          language: 'python',
          sourceCode: 'while True: pass',
        },
        'user123'
      );

      expect(result.telemetry.status).toBe('time_limit_exceeded');
      expect(result.telemetry.exitCode).toBe(124);
      expect(result.stderr).toContain('Execution timed out');
    });

    it('handles malformed JSON from provider', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Unexpected token < in JSON');
        },
      });

      const result = await service.execute(
        {
          language: 'python',
          sourceCode: 'print(1)',
        },
        'user123'
      );

      expect(result.telemetry.status).toBe('error');
      expect(result.stderr).toContain('malformed response');
    });
  });
});
