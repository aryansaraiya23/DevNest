import { User, LoginCredentials, SignUpCredentials } from '../types/auth';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

/**
 * Shared fetch helper — always sends cookies and expects JSON.
 */
function readErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const body = data as { message?: unknown; error?: unknown; details?: { message?: string }[] };
  if (typeof body.message === 'string' && body.message.trim()) return body.message;
  const firstDetail = body.details?.[0]?.message;
  if (typeof firstDetail === 'string' && firstDetail.trim()) return firstDetail;
  if (typeof body.error === 'string' && body.error.trim()) return body.error;
  return fallback;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include', // Required for HTTP-only cookie auth
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new Error('Unable to reach the DevNest server. Please try again.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(readErrorMessage(data, `Request failed with status ${res.status}`));
  }

  return data as T;
}

// ─── Auth API Service ─────────────────────────────────────────────────────────

export interface AuthResponse {
  message: string;
  user: User;
}

class AuthApiService {
  /**
   * Create a new account. The server sets an HTTP-only JWT cookie on success.
   */
  async register(credentials: SignUpCredentials): Promise<User> {
    const { user } = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: credentials.name,
        email: credentials.email,
        password: credentials.password,
      }),
    });
    return user;
  }

  /**
   * Sign in with email + password. The server sets an HTTP-only JWT cookie on success.
   */
  async login(credentials: LoginCredentials): Promise<User> {
    const { user } = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });
    return user;
  }

  /**
   * Sign out — clears the HTTP-only cookie on the server.
   */
  async logout(): Promise<void> {
    await apiFetch<{ message: string }>('/auth/logout', { method: 'POST' });
  }

  /**
   * Fetch the currently authenticated user's profile (via cookie).
   * Returns null if the user is not authenticated.
   */
  async getMe(): Promise<User | null> {
    try {
      const { user } = await apiFetch<{ user: User }>('/auth/me');
      return user;
    } catch {
      return null;
    }
  }
}

export const authApiService = new AuthApiService();
