import { User, LoginCredentials, SignUpCredentials } from '../types/auth';
import { DEMO_USER } from '../data/mockData';

const SESSION_STORAGE_KEY = 'devnest_mock_session';

/**
 * Mock Authentication Service
 * NOTE: For demonstration purposes only. Does not store real passwords or JWTs.
 * Designed to be swapped seamlessly with real API endpoints in Milestone 2.
 */
class MockAuthService {
  private simulateDelay(ms = 350): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async login(credentials: LoginCredentials): Promise<User> {
    await this.simulateDelay();

    const normalizedEmail = credentials.email.trim().toLowerCase();

    // Check against standard demo credentials or accept demo accounts
    if (normalizedEmail === DEMO_USER.email.toLowerCase()) {
      if (credentials.password !== 'password123' && credentials.password.length < 6) {
        throw new Error('Invalid demo password. Use "password123" or any password with at least 6 characters.');
      }
      this.persistSession(DEMO_USER);
      return DEMO_USER;
    }

    // Dynamic mock login for any valid email test
    if (credentials.password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const customUser: User = {
      id: `usr_${Date.now()}`,
      name: normalizedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email: normalizedEmail,
      createdAt: new Date().toISOString(),
    };

    this.persistSession(customUser);
    return customUser;
  }

  public async register(credentials: SignUpCredentials): Promise<User> {
    await this.simulateDelay();

    if (!credentials.name.trim()) {
      throw new Error('Full name is required.');
    }

    if (!credentials.email.includes('@')) {
      throw new Error('Please provide a valid email address.');
    }

    if (credentials.password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    if (credentials.password !== credentials.confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: credentials.name.trim(),
      email: credentials.email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
    };

    this.persistSession(newUser);
    return newUser;
  }

  public getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  }

  public async logout(): Promise<void> {
    await this.simulateDelay(150);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Fallback
    }
  }

  private persistSession(user: User): void {
    try {
      // Store non-sensitive user profile marker only
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('[DevNest Auth] Failed to write mock session to localStorage', e);
    }
  }
}

export const mockAuthService = new MockAuthService();
