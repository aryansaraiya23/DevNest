import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  ExecutionResult,
  ExecutionStatusType,
  BatchTestResult,
  TestCaseResult,
  TestVerdict,
} from '@devnest/shared';
import { env } from '../config/env';
import { projectService } from './project.service';
import { ExecuteCodeInput, RunBatchTestsInput } from '../validators/execution.validator';

export class ExecutionConfigError extends Error {
  constructor(message = 'Execution provider API key is not configured.') {
    super(message);
    this.name = 'ExecutionConfigError';
  }
}

export interface OnlineCompilerRunResponse {
  output?: string;
  error?: string;
  status?: 'success' | 'error' | string;
  exit_code?: number;
  signal?: number | null;
  truncated?: boolean;
  time?: string;
  total?: string;
  memory?: string;
  time_limit?: number;
}

export interface OnlineCompilerTestCaseResponse {
  verdict?: string;
  output?: string;
  error?: string;
  time?: string;
  memory?: string;
  exit_code?: number;
  signal?: number | null;
  hidden?: boolean;
}

export interface OnlineCompilerBatchResponse {
  verdict?: string;
  score?: number;
  passed?: number;
  total?: number;
  time_limit?: number;
  compile_error?: string | null;
  tests?: OnlineCompilerTestCaseResponse[];
}


export class ExecutionService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey = env.ONLINECOMPILER_API_KEY, baseUrl = env.ONLINECOMPILER_BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Resolve language to OnlineCompiler.io compiler ID
   */
  public resolveCompilerId(language: SupportedLanguage): string {
    const config = SUPPORTED_LANGUAGES[language];
    if (config?.compilerId) {
      return config.compilerId;
    }
    switch (language) {
      case 'javascript':
        return 'nodejs-24';
      case 'python':
        return 'python-3.14';
      case 'cpp':
        return 'g++-15';
      case 'java':
        return 'openjdk-25';
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  /**
   * Executes code using OnlineCompiler.io sandboxed execution API.
   * Never runs user code directly on the Express server.
   */
  public async execute(
    input: ExecuteCodeInput,
    userId: string
  ): Promise<ExecutionResult> {
    // 1. Verify project ownership if projectId is provided
    if (input.projectId) {
      await projectService.getProjectById(input.projectId, userId);
    }

    const compilerId = this.resolveCompilerId(input.language);
    const apiKey = this.apiKey;

    // Check if provider API key is configured
    if (!apiKey) {
      throw new ExecutionConfigError(
        'OnlineCompiler.io API key is not configured. Please set ONLINECOMPILER_API_KEY in server/.env.'
      );
    }

    const endpoint = `${this.baseUrl}/api/run-code-sync/`;
    const requestPayload = {
      compiler: compilerId,
      code: input.sourceCode,
      input: input.stdin || '',
      time_limit: 10,
    };

    // Use AbortController for execution timeout (15s request ceiling)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: apiKey, // OnlineCompiler.io expects bare key (no Bearer prefix)
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-200 provider responses
      if (!response.ok) {
        let errorMessage = `Provider responded with status ${response.status}`;
        try {
          const errBody = (await response.json()) as { error?: string };
          if (errBody?.error) {
            errorMessage = errBody.error;
          }
        } catch {
          // If JSON parse fails, use status text
          errorMessage = response.statusText || errorMessage;
        }

        return this.createErrorResult(
          response.status === 429
            ? 'OnlineCompiler.io rate limit reached. Please try again shortly.'
            : `Execution provider error (${response.status}): ${errorMessage}`,
          response.status === 429 ? 'error' : 'error',
          null
        );
      }

      // Parse JSON result safely
      let data: OnlineCompilerRunResponse;
      try {
        data = (await response.json()) as OnlineCompilerRunResponse;
      } catch {
        return this.createErrorResult(
          'Received malformed response from execution provider.',
          'error',
          null
        );
      }

      return this.normalizeResult(data, input.language);
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof Error && err.name === 'AbortError') {
        return this.createErrorResult(
          'Execution timed out. The program exceeded the maximum execution limit.',
          'time_limit_exceeded',
          124
        );
      }

      const message = err instanceof Error ? err.message : 'Unknown execution error';
      return this.createErrorResult(
        `Failed to reach execution provider: ${message}`,
        'error',
        null
      );
    }
  }

  /**
   * Normalizes OnlineCompiler.io response into DevNest ExecutionResult contract
   */
  public normalizeResult(
    data: OnlineCompilerRunResponse,
    _language: SupportedLanguage
  ): ExecutionResult {
    const exitCode = typeof data.exit_code === 'number' ? data.exit_code : 0;
    const stdout = data.output ?? '';
    const stderr = data.error ?? '';

    // Calculate execution time in milliseconds
    let timeMs: number | null = null;
    const timeStr = data.total || data.time;
    if (timeStr) {
      const parsedSeconds = parseFloat(timeStr);
      if (!isNaN(parsedSeconds)) {
        timeMs = Math.round(parsedSeconds * 1000);
      }
    }

    // Parse memory in KB
    let memoryKb: number | null = null;
    if (data.memory) {
      const parsedMem = parseInt(data.memory, 10);
      if (!isNaN(parsedMem)) {
        memoryKb = parsedMem;
      }
    }

    // Determine status & status description
    let status: ExecutionStatusType = 'success';
    let statusDescription = 'Execution completed successfully';
    let compileOutput: string | null = null;

    if (exitCode === 0 && data.status !== 'error') {
      status = 'success';
      statusDescription = 'Execution completed successfully';
    } else if (exitCode === 124) {
      status = 'time_limit_exceeded';
      statusDescription = 'Time limit exceeded';
    } else if (exitCode === 137) {
      status = 'memory_limit_exceeded';
      statusDescription = 'Memory limit exceeded';
    } else {
      // Check if this is a compilation error vs runtime error
      const isCompileError =
        stderr.includes('error:') ||
        stderr.includes('Compilation failed') ||
        stderr.includes('javac') ||
        stderr.includes('g++:') ||
        stderr.includes('SyntaxError');

      if (isCompileError && !stdout) {
        status = 'compilation_error';
        statusDescription = 'Compilation error';
        compileOutput = stderr;
      } else {
        status = 'runtime_error';
        statusDescription = `Process exited with code ${exitCode}`;
      }
    }

    return {
      stdout: stdout || null,
      stderr: stderr || null,
      compileOutput,
      telemetry: {
        timeMs,
        memoryKb,
        exitCode,
        status,
        statusDescription,
      },
    };
  }

  /**
   * Normalize OnlineCompiler test verdict string to DevNest TestVerdict
   */
  public normalizeVerdict(rawVerdict: string): TestVerdict {
    const lower = (rawVerdict || '').toLowerCase().trim();
    if (lower === 'accepted' || lower === 'ac' || lower === 'pass' || lower === 'passed' || lower === 'ok') {
      return 'accepted';
    }
    if (lower === 'wrong_answer' || lower === 'wa' || lower === 'fail' || lower === 'failed') {
      return 'wrong_answer';
    }
    if (lower === 'time_limit_exceeded' || lower === 'tle' || lower === 'timeout') {
      return 'time_limit_exceeded';
    }
    if (lower === 'memory_limit_exceeded' || lower === 'mle') {
      return 'memory_limit_exceeded';
    }
    if (lower === 'compilation_error' || lower === 'ce' || lower === 'compile_error') {
      return 'compilation_error';
    }
    if (lower === 'runtime_error' || lower === 're' || lower === 'crash') {
      return 'runtime_error';
    }
    return 'error';
  }

  /**
   * Run multiple test cases using OnlineCompiler.io /api/run-tests/ endpoint
   * with automatic fallback if endpoint returns 404 or fails.
   */
  public async runTests(
    input: RunBatchTestsInput,
    userId: string
  ): Promise<BatchTestResult> {
    if (input.projectId) {
      await projectService.getProjectById(input.projectId, userId);
    }

    const apiKey = this.apiKey;
    if (!apiKey) {
      throw new ExecutionConfigError(
        'OnlineCompiler.io API key is not configured. Please set ONLINECOMPILER_API_KEY in server/.env.'
      );
    }

    const compilerId = this.resolveCompilerId(input.language);
    const endpoint = `${this.baseUrl}/api/run-tests/`;
    const requestPayload = {
      compiler: compilerId,
      code: input.sourceCode,
      tests: input.tests.map((t) => ({
        input: t.input ?? '',
        expected_output: t.expectedOutput ?? '',
      })),
      time_limit: 5,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: apiKey,
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If the provider returns 404 (e.g. endpoint not supported on current plan), fall back to sequential execution
      if (response.status === 404) {
        return await this.executeSequentialFallback(input, userId);
      }

      if (!response.ok) {
        let errorMessage = `Provider error (${response.status})`;
        try {
          const errBody = (await response.json()) as { error?: string };
          if (errBody?.error) errorMessage = errBody.error;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }

        return this.createBatchErrorResult(
          input.tests,
          response.status === 429
            ? 'OnlineCompiler.io rate limit reached. Please try again shortly.'
            : `Test runner provider error (${response.status}): ${errorMessage}`
        );
      }

      let data: OnlineCompilerBatchResponse;
      try {
        data = (await response.json()) as OnlineCompilerBatchResponse;
      } catch {
        return this.createBatchErrorResult(
          input.tests,
          'Received malformed response from test runner provider.'
        );
      }

      return this.normalizeBatchResult(data, input);
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof Error && err.name === 'AbortError') {
        return this.createBatchErrorResult(
          input.tests,
          'Test suite execution timed out. One or more tests exceeded execution limits.'
        );
      }

      const message = err instanceof Error ? err.message : 'Unknown test runner error';
      return this.createBatchErrorResult(
        input.tests,
        `Failed to reach test runner provider: ${message}`
      );
    }
  }

  /**
   * Normalizes OnlineCompiler batch response
   */
  public normalizeBatchResult(
    data: OnlineCompilerBatchResponse,
    input: RunBatchTestsInput
  ): BatchTestResult {
    let totalTimeMs = 0;
    let peakMemoryKb = 0;
    let passedCount = 0;

    const testResults: TestCaseResult[] = input.tests.map((test, idx) => {
      const providerTest = data.tests?.[idx];
      let verdict: TestVerdict = 'error';

      if (data.compile_error) {
        verdict = 'compilation_error';
      } else if (providerTest?.verdict) {
        verdict = this.normalizeVerdict(providerTest.verdict);
      } else if (providerTest) {
        const actual = (providerTest.output || '').trim();
        const expected = (test.expectedOutput || '').trim();
        verdict = actual === expected ? 'accepted' : 'wrong_answer';
      }

      if (verdict === 'accepted') {
        passedCount++;
      }

      let timeMs: number | null = null;
      if (providerTest?.time) {
        const parsedTime = parseFloat(providerTest.time);
        if (!isNaN(parsedTime)) {
          timeMs = Math.round(parsedTime * 1000);
          totalTimeMs += timeMs;
        }
      }

      let memoryKb: number | null = null;
      if (providerTest?.memory) {
        const parsedMem = parseInt(providerTest.memory, 10);
        if (!isNaN(parsedMem)) {
          memoryKb = parsedMem;
          if (memoryKb > peakMemoryKb) {
            peakMemoryKb = memoryKb;
          }
        }
      }

      return {
        id: test.id,
        testIndex: idx + 1,
        verdict,
        input: test.input,
        expectedOutput: test.expectedOutput,
        actualOutput: providerTest?.output ?? '',
        error: providerTest?.error || (data.compile_error ?? undefined),
        timeMs,
        memoryKb,
        exitCode: providerTest?.exit_code ?? (verdict === 'accepted' ? 0 : 1),
      };
    });

    let overallVerdict: TestVerdict = 'accepted';
    if (data.compile_error) {
      overallVerdict = 'compilation_error';
    } else if (data.verdict) {
      overallVerdict = this.normalizeVerdict(data.verdict);
    } else {
      overallVerdict = passedCount === input.tests.length ? 'accepted' : 'wrong_answer';
    }

    return {
      verdict: overallVerdict,
      passedCount,
      totalCount: input.tests.length,
      score: data.score ?? (input.tests.length > 0 ? (passedCount / input.tests.length) * 100 : 0),
      compileOutput: data.compile_error || null,
      tests: testResults,
      telemetry: {
        totalTimeMs: totalTimeMs > 0 ? totalTimeMs : null,
        peakMemoryKb: peakMemoryKb > 0 ? peakMemoryKb : null,
      },
    };
  }

  /**
   * Fallback sequential execution if /api/run-tests/ is unavailable
   */
  public async executeSequentialFallback(
    input: RunBatchTestsInput,
    userId: string
  ): Promise<BatchTestResult> {
    const testResults: TestCaseResult[] = [];
    let passedCount = 0;
    let totalTimeMs = 0;
    let peakMemoryKb = 0;
    let overallVerdict: TestVerdict = 'accepted';
    let compileOutput: string | null = null;

    for (let i = 0; i < input.tests.length; i++) {
      const test = input.tests[i];
      const singleRes = await this.execute(
        {
          language: input.language,
          sourceCode: input.sourceCode,
          stdin: test.input,
          projectId: input.projectId,
        },
        userId
      );

      if (singleRes.compileOutput || singleRes.telemetry.status === 'compilation_error') {
        overallVerdict = 'compilation_error';
        compileOutput = singleRes.compileOutput || singleRes.stderr;
        testResults.push({
          id: test.id,
          testIndex: i + 1,
          verdict: 'compilation_error',
          input: test.input,
          expectedOutput: test.expectedOutput,
          actualOutput: '',
          error: compileOutput || 'Compilation error',
          timeMs: null,
          memoryKb: null,
          exitCode: singleRes.telemetry.exitCode,
        });
        break;
      }

      let verdict: TestVerdict = 'accepted';
      if (singleRes.telemetry.status === 'time_limit_exceeded') {
        verdict = 'time_limit_exceeded';
      } else if (singleRes.telemetry.status === 'runtime_error') {
        verdict = 'runtime_error';
      } else {
        const actual = (singleRes.stdout || '').trim();
        const expected = (test.expectedOutput || '').trim();
        verdict = actual === expected ? 'accepted' : 'wrong_answer';
      }

      if (verdict === 'accepted') {
        passedCount++;
      } else if (overallVerdict === 'accepted') {
        overallVerdict = verdict;
      }

      if (singleRes.telemetry.timeMs) {
        totalTimeMs += singleRes.telemetry.timeMs;
      }
      if (singleRes.telemetry.memoryKb && singleRes.telemetry.memoryKb > peakMemoryKb) {
        peakMemoryKb = singleRes.telemetry.memoryKb;
      }

      testResults.push({
        id: test.id,
        testIndex: i + 1,
        verdict,
        input: test.input,
        expectedOutput: test.expectedOutput,
        actualOutput: singleRes.stdout ?? '',
        error: singleRes.stderr ?? undefined,
        timeMs: singleRes.telemetry.timeMs,
        memoryKb: singleRes.telemetry.memoryKb,
        exitCode: singleRes.telemetry.exitCode,
      });
    }

    return {
      verdict: overallVerdict,
      passedCount,
      totalCount: input.tests.length,
      score: input.tests.length > 0 ? (passedCount / input.tests.length) * 100 : 0,
      compileOutput,
      tests: testResults,
      telemetry: {
        totalTimeMs: totalTimeMs > 0 ? totalTimeMs : null,
        peakMemoryKb: peakMemoryKb > 0 ? peakMemoryKb : null,
      },
    };
  }

  private createBatchErrorResult(
    tests: RunBatchTestsInput['tests'],
    errorMessage: string
  ): BatchTestResult {
    return {
      verdict: 'error',
      passedCount: 0,
      totalCount: tests.length,
      score: 0,
      compileOutput: null,
      tests: tests.map((t, idx) => ({
        id: t.id,
        testIndex: idx + 1,
        verdict: 'error',
        input: t.input,
        expectedOutput: t.expectedOutput,
        actualOutput: '',
        error: errorMessage,
        timeMs: null,
        memoryKb: null,
        exitCode: null,
      })),
      telemetry: {
        totalTimeMs: null,
        peakMemoryKb: null,
      },
    };
  }

  /**
   * Helper to create normalized error result
   */
  private createErrorResult(
    errorMessage: string,
    status: ExecutionStatusType,
    exitCode: number | null
  ): ExecutionResult {
    return {
      stdout: null,
      stderr: errorMessage,
      compileOutput: null,
      telemetry: {
        timeMs: null,
        memoryKb: null,
        exitCode,
        status,
        statusDescription: errorMessage,
      },
    };
  }
}

export const executionService = new ExecutionService();

