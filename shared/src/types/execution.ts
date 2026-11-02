import { SupportedLanguage } from './language';

export type ExecutionStatusType =
  | 'queued'
  | 'processing'
  | 'success'
  | 'compilation_error'
  | 'runtime_error'
  | 'time_limit_exceeded'
  | 'memory_limit_exceeded'
  | 'error';

export interface ExecutionRequest {
  language: SupportedLanguage;
  sourceCode: string;
  stdin?: string;
  projectId?: string;
}

export interface ExecutionTelemetry {
  timeMs: number | null;
  memoryKb: number | null;
  exitCode: number | null;
  status: ExecutionStatusType;
  statusDescription: string;
}

export interface ExecutionResult {
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  telemetry: ExecutionTelemetry;
}

export type TestVerdict =
  | 'accepted'
  | 'wrong_answer'
  | 'time_limit_exceeded'
  | 'runtime_error'
  | 'compilation_error'
  | 'memory_limit_exceeded'
  | 'error';

export interface TestCaseInput {
  id?: string;
  input: string;
  expectedOutput?: string;
}

export interface TestCaseResult {
  id?: string;
  testIndex: number;
  verdict: TestVerdict;
  input: string;
  expectedOutput?: string;
  actualOutput?: string;
  error?: string;
  timeMs: number | null;
  memoryKb: number | null;
  exitCode: number | null;
}

export interface BatchTestRequest {
  language: SupportedLanguage;
  sourceCode: string;
  tests: TestCaseInput[];
  projectId?: string;
}

export interface BatchTestResult {
  verdict: TestVerdict;
  passedCount: number;
  totalCount: number;
  score?: number;
  compileOutput?: string | null;
  tests: TestCaseResult[];
  telemetry: {
    totalTimeMs: number | null;
    peakMemoryKb: number | null;
  };
}

