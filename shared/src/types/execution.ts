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
