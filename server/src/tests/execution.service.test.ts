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

  describe('normalizeVerdict', () => {
    it('correctly maps various verdict formats', () => {
      expect(service.normalizeVerdict('accepted')).toBe('accepted');
      expect(service.normalizeVerdict('AC')).toBe('accepted');
      expect(service.normalizeVerdict('wrong_answer')).toBe('wrong_answer');
      expect(service.normalizeVerdict('WA')).toBe('wrong_answer');
      expect(service.normalizeVerdict('time_limit_exceeded')).toBe('time_limit_exceeded');
      expect(service.normalizeVerdict('TLE')).toBe('time_limit_exceeded');
      expect(service.normalizeVerdict('memory_limit_exceeded')).toBe('memory_limit_exceeded');
      expect(service.normalizeVerdict('compilation_error')).toBe('compilation_error');
      expect(service.normalizeVerdict('CE')).toBe('compilation_error');
      expect(service.normalizeVerdict('runtime_error')).toBe('runtime_error');
      expect(service.normalizeVerdict('RE')).toBe('runtime_error');
      expect(service.normalizeVerdict('unknown_code')).toBe('error');
    });
  });

  describe('runTests', () => {
    it('throws ExecutionConfigError when API key is missing', async () => {
      const noKeyService = new ExecutionService('', mockBaseUrl);
      await expect(
        noKeyService.runTests(
          {
            language: 'python',
            sourceCode: 'print(1)',
            tests: [{ input: '', expectedOutput: '1\n' }],
          },
          'user123'
        )
      ).rejects.toThrow(ExecutionConfigError);
    });

    it('verifies project ownership when projectId is passed', async () => {
      vi.spyOn(projectService, 'getProjectById').mockRejectedValue(
        new ProjectNotFoundError('Project not found')
      );

      await expect(
        service.runTests(
          {
            language: 'python',
            sourceCode: 'print(1)',
            projectId: 'invalid_proj',
            tests: [{ input: '', expectedOutput: '1\n' }],
          },
          'user123'
        )
      ).rejects.toThrow(ProjectNotFoundError);
    });

    it('successfully evaluates batch tests via /api/run-tests/', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          verdict: 'accepted',
          score: 100,
          passed: 2,
          total: 2,
          compile_error: null,
          tests: [
            {
              verdict: 'accepted',
              output: '4\n',
              error: '',
              time: '0.015',
              memory: '4096',
              exit_code: 0,
            },
            {
              verdict: 'accepted',
              output: '9\n',
              error: '',
              time: '0.018',
              memory: '4120',
              exit_code: 0,
            },
          ],
        }),
      });

      const batchResult = await service.runTests(
        {
          language: 'python',
          sourceCode: 'n = int(input())\nprint(n * n)',
          tests: [
            { input: '2\n', expectedOutput: '4\n' },
            { input: '3\n', expectedOutput: '9\n' },
          ],
        },
        'user123'
      );

      expect(batchResult.verdict).toBe('accepted');
      expect(batchResult.passedCount).toBe(2);
      expect(batchResult.totalCount).toBe(2);
      expect(batchResult.score).toBe(100);
      expect(batchResult.telemetry.totalTimeMs).toBe(33); // 15ms + 18ms
      expect(batchResult.telemetry.peakMemoryKb).toBe(4120);
      expect(batchResult.tests).toHaveLength(2);
      expect(batchResult.tests[0].verdict).toBe('accepted');
      expect(batchResult.tests[0].actualOutput).toBe('4\n');
    });

    it('handles mixed test verdicts (accepted and wrong_answer)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          verdict: 'wrong_answer',
          score: 50,
          passed: 1,
          total: 2,
          compile_error: null,
          tests: [
            {
              verdict: 'accepted',
              output: '4\n',
              error: '',
              time: '0.015',
              memory: '4096',
              exit_code: 0,
            },
            {
              verdict: 'wrong_answer',
              output: '6\n',
              error: '',
              time: '0.016',
              memory: '4096',
              exit_code: 0,
            },
          ],
        }),
      });

      const batchResult = await service.runTests(
        {
          language: 'python',
          sourceCode: 'print(4)',
          tests: [
            { input: '2\n', expectedOutput: '4\n' },
            { input: '3\n', expectedOutput: '9\n' },
          ],
        },
        'user123'
      );

      expect(batchResult.verdict).toBe('wrong_answer');
      expect(batchResult.passedCount).toBe(1);
      expect(batchResult.totalCount).toBe(2);
      expect(batchResult.tests[1].verdict).toBe('wrong_answer');
      expect(batchResult.tests[1].actualOutput).toBe('6\n');
    });

    it('handles compilation errors during batch test execution', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          verdict: 'compilation_error',
          compile_error: 'SyntaxError: invalid syntax on line 1',
          passed: 0,
          total: 1,
          tests: [],
        }),
      });

      const batchResult = await service.runTests(
        {
          language: 'python',
          sourceCode: 'invalid syntax def',
          tests: [{ input: '', expectedOutput: '' }],
        },
        'user123'
      );

      expect(batchResult.verdict).toBe('compilation_error');
      expect(batchResult.compileOutput).toContain('SyntaxError');
      expect(batchResult.passedCount).toBe(0);
    });

    it('gracefully falls back to sequential execution if /api/run-tests/ returns 404', async () => {
      // First call (/api/run-tests/) returns 404
      // Subsequent calls (/api/run-code-sync/) succeed
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            output: '10\n',
            error: '',
            status: 'success',
            exit_code: 0,
            total: '0.025',
            memory: '5000',
          }),
        });

      const batchResult = await service.runTests(
        {
          language: 'python',
          sourceCode: 'print(10)',
          tests: [{ input: '', expectedOutput: '10\n' }],
        },
        'user123'
      );

      expect(batchResult.verdict).toBe('accepted');
      expect(batchResult.passedCount).toBe(1);
      expect(batchResult.totalCount).toBe(1);
      expect(batchResult.tests[0].actualOutput).toBe('10\n');
    });

    it('handles rate limits (429) from test provider', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'Rate limit exceeded' }),
      });

      const batchResult = await service.runTests(
        {
          language: 'python',
          sourceCode: 'print(1)',
          tests: [{ input: '', expectedOutput: '1' }],
        },
        'user123'
      );

      expect(batchResult.verdict).toBe('error');
      expect(batchResult.tests[0].error).toContain('rate limit reached');
    });

    it('handles test execution timeout', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      global.fetch = vi.fn().mockRejectedValue(abortError);

      const batchResult = await service.runTests(
        {
          language: 'python',
          sourceCode: 'while True: pass',
          tests: [{ input: '', expectedOutput: '' }],
        },
        'user123'
      );

      expect(batchResult.verdict).toBe('error');
      expect(batchResult.tests[0].error).toContain('timed out');
    });
  });
});

