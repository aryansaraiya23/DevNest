import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { authService, AuthenticationError, DuplicateEmailError } from '../services/auth.service';
import { AUTH_COOKIE_NAME } from '../middleware/auth';
import { env } from '../config/env';

/**
 * Standard cookie configuration options
 */
export function getAuthCookieOptions() {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
}

export class AuthController {
  /**
   * Registers a new user account and sets session cookie
   */
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const parsed = registerSchema.parse(req.body);
      const { user, token } = await authService.register(parsed);

      res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
      res.status(201).json({
        message: 'Account created successfully.',
        user,
      });
    } catch (err: any) {
      if (err instanceof ZodError) {
        const firstError = err.issues[0]?.message || 'Invalid input data.';
        res.status(400).json({
          error: 'Validation Error',
          message: firstError,
          details: err.issues.map((e) => ({ field: e.path.map(String).join('.'), message: e.message })),
        });
        return;
      }

      if (err instanceof DuplicateEmailError) {
        res.status(409).json({
          error: 'Conflict',
          message: err.message,
        });
        return;
      }

      console.error('[Registration Error]', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during registration. Please try again.',
      });
    }
  }

  /**
   * Authenticates an existing user and sets session cookie
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const parsed = loginSchema.parse(req.body);
      const { user, token } = await authService.login(parsed);

      res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
      res.status(200).json({
        message: 'Login successful.',
        user,
      });
    } catch (err: any) {
      if (err instanceof ZodError) {
        const firstError = err.issues[0]?.message || 'Invalid email or password.';
        res.status(400).json({
          error: 'Validation Error',
          message: firstError,
        });
        return;
      }

      if (err instanceof AuthenticationError) {
        res.status(401).json({
          error: 'Unauthorized',
          message: err.message,
        });
        return;
      }

      console.error('[Login Error]', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during login. Please try again.',
      });
    }
  }

  /**
   * Logs out user by clearing the session cookie
   */
  public async logout(_req: Request, res: Response): Promise<void> {
    const isProduction = env.NODE_ENV === 'production';
    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });

    res.status(200).json({
      message: 'Logged out successfully.',
    });
  }

  /**
   * Returns authenticated user profile
   */
  public async getMe(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated.',
      });
      return;
    }

    res.status(200).json({
      user: req.user,
    });
  }
}

export const authController = new AuthController();
