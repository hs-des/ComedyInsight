/**
 * Auth Middleware - JWT authentication
 */

import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../services/jwt.service';
import { JwtPayload } from '../types/auth.types';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Authenticate JWT token
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.log('[AUTH] No token provided');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token required',
      });
      return;
    }

    console.log('[AUTH] Verifying token...');
    const decoded = jwtService.verifyAccessToken(token);
    req.user = decoded;
    console.log('[AUTH] Token verified successfully');
    next();
  } catch (error: any) {
    console.error('[AUTH] Token verification failed:', error?.message);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwtService.verifyAccessToken(token);
      req.user = decoded;
    }
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

