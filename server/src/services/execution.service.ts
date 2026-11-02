import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  ExecutionResult,
  ExecutionStatusType,
} from '@devnest/shared';
import { env } from '../config/env';
import { projectService } from './project.service';
import { ExecuteCodeInput } from '../validators/execution.validator';

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
    const apiKey = this.apiKey || env.ONLINECOMPILER_API_KEY;

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
