/**
 * JWT Security Enhancements
 * Token rotation, refresh token management, blacklist
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { jwtService } from '../services/jwt.service';

/**
 * Store for blacklisted tokens (use Redis in production)
 */
const tokenBlacklist: Set<string> = new Set();

/**
 * Check if token is blacklisted
 */
export const checkTokenBlacklist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token && tokenBlacklist.has(token)) {
    return res.status(401).json({ message: 'Token has been revoked' });
  }

  next();
};

/**
 * Add token to blacklist
 */
export const blacklistToken = (token: string) => {
  tokenBlacklist.add(token);
  // In production, store in Redis with TTL matching token expiry
};

/**
 * Database-backed refresh token management
 */
export class RefreshTokenService {
  constructor(private db: Pool) {}

  /**
   * Store refresh token
   */
  async storeRefreshToken(userId: string, token: string, deviceId?: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await this.db.query(
      `
      INSERT INTO refresh_tokens (user_id, token, device_id, expires_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, device_id) 
      DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at
      `,
      [userId, token, deviceId || 'default', expiresAt]
    );
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<string | null> {
    // First verify JWT signature
    const decoded = jwtService.verifyRefreshToken(token);

    // Then check database
    const result = await this.db.query(
      'SELECT user_id FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].user_id;
  }

  /**
   * Revoke all refresh tokens for user
   */
  async revokeAllTokens(userId: string): Promise<void> {
    await this.db.query(
      'DELETE FROM refresh_tokens WHERE user_id = $1',
      [userId]
    );
  }

  /**
   * Revoke specific refresh token
   */
  async revokeToken(token: string): Promise<void> {
    await this.db.query(
      'DELETE FROM refresh_tokens WHERE token = $1',
      [token]
    );
  }

  /**
   * Clean expired tokens (run as cron job)
   */
  async cleanExpiredTokens(): Promise<void> {
    await this.db.query(
      'DELETE FROM refresh_tokens WHERE expires_at < NOW()'
    );
  }
}

/**
 * Refresh token table migration
 */
export const createRefreshTokenTable = `
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_id VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, device_id)
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
`;

/**
 * Rotate refresh tokens (security best practice)
 */
export const rotateRefreshToken = async (
  db: Pool,
  userId: string,
  oldToken: string,
  deviceId?: string
): Promise<string> => {
  const refreshTokenService = new RefreshTokenService(db);

  // Verify old token
  const validUserId = await refreshTokenService.verifyRefreshToken(oldToken);
  if (!validUserId || validUserId !== userId) {
    throw new Error('Invalid refresh token');
  }

  // Revoke old token
  await refreshTokenService.revokeToken(oldToken);

  // Generate new token
  const newToken = jwtService.generateRefreshToken(userId);

  // Store new token
  await refreshTokenService.storeRefreshToken(userId, newToken, deviceId);

  return newToken;
};

