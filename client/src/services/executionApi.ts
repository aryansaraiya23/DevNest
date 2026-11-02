import { ExecutionRequest, ExecutionResult } from '@devnest/shared';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

function readErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const body = data as { message?: unknown; error?: unknown; details?: { message?: string }[] };
  if (typeof body.message === 'string' && body.message.trim()) return body.message;
  const firstDetail = body.details?.[0]?.message;
  if (typeof firstDetail === 'string' && firstDetail.trim()) return firstDetail;
  if (typeof body.error === 'string' && body.error.trim()) return body.error;
  return fallback;
}

export class ExecutionApiService {
  /**
   * Dispatches code execution request to the backend proxy
   */
  public async executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/execute`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
    } catch {
      throw new Error('Unable to reach the DevNest execution server. Please check your connection.');
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(readErrorMessage(data, `Execution failed with status ${res.status}`));
    }

    return data as ExecutionResult;
  }
}

export const executionApi = new ExecutionApiService();
