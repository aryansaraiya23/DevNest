import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { authService, AuthenticationError } from '../services/auth.service';
import { SafeUser } from '../models/User';

export const AUTH_COOKIE_NAME = 'devnest_token';

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}

/**
 * Reusable authentication middleware to protect endpoints
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check HTTP-only cookie first, fallback to Authorization header
    let token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication session is missing. Please sign in.',
      });
      return;
    }

    const payload = authService.verifyToken(token);
    const user = await authService.getUserById(payload.userId);

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof AuthenticationError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: err.message,
      });
      return;
    }

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication session is invalid or expired.',
    });
  }
}

/**
 * Rate limiter for authentication endpoints to prevent brute-force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts from this IP, please try again in 15 minutes.',
  },
  skip: () => process.env.NODE_ENV === 'test', // Skip rate limiting during automated unit tests
});
