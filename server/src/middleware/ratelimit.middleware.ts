/**
 * Rate Limiting Middleware
 * Protect endpoints from abuse
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Create rate limiter with custom settings
 */
export const createRateLimiter = (
  windowMs: number,
  maxRequests: number,
  message: string
) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Too many requests',
        message,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

/**
 * OTP rate limiter: 5 requests per hour
 */
export const otpRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  5,
  'Too many OTP requests. Please try again later.'
);

/**
 * Login rate limiter: 10 requests per 15 minutes
 */
export const loginRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10,
  'Too many login attempts. Please try again later.'
);

/**
 * General API rate limiter: 100 requests per minute
 */
export const apiRateLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  100,
  'Too many API requests. Please slow down.'
);

/**
 * Strict rate limiter: 10 requests per minute
 */
export const strictRateLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10,
  'Too many requests. Please try again in a minute.'
);

/**
 * Video upload rate limiter: 10 uploads per day
 */
export const uploadRateLimiter = createRateLimiter(
  24 * 60 * 60 * 1000, // 24 hours
  10,
  'Upload limit reached. Please try again tomorrow.'
);

/**
 * IP-based rate limiter with Redis store (optional)
 */
export const ipRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  // Optionally use Redis for distributed rate limiting
  // store: new RedisStore({ client: redisClient }),
});

/**
 * User-based rate limiter (for authenticated users)
 */
export const userRateLimiter = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise IP
      return (req as any).user?.userId || req.ip;
    },
    message: 'Rate limit exceeded for this account',
  });
};

/**
 * Dynamic rate limiter based on endpoint
 */
export const dynamicRateLimiter = (req: Request): number => {
  const path = req.path;
  const method = req.method;

  // Stricter limits for write operations
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
    return 50; // 50 requests per minute
  }

  // Different limits for different endpoints
  if (path.includes('/admin')) {
    return 30; // 30 requests per minute for admin
  }

  if (path.includes('/downloads/request')) {
    return 10; // 10 download requests per minute
  }

  return 100; // Default: 100 requests per minute
};

/**
 * Rate limiter with custom key generator
 */
export const customRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: (req: Request) => dynamicRateLimiter(req),
  message: 'Rate limit exceeded',
});

