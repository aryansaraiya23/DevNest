import rateLimit from 'express-rate-limit';

/**
 * Per-user rate limiter for code execution requests to prevent API abuse
 * Allows up to 20 code executions per minute per authenticated user (or IP fallback).
 */
export const executionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  message: {
    error: 'Too Many Requests',
    message: 'Execution rate limit exceeded. Please wait a moment before running code again.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});
