/**
 * JWT Service - Token generation and verification
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import { JwtPayload, AuthError } from '../types/auth.types';

export class JWTService {
  private secret: string;
  private accessTokenExpiry: string = '7d';
  private refreshTokenExpiry: string = '30d';

  constructor() {
    this.secret = process.env.JWT_SECRET || 'change-me-in-production';
    if (!process.env.JWT_SECRET) {
      console.warn(
        '⚠️  JWT_SECRET not set. Using default secret (NOT SECURE FOR PRODUCTION)'
      );
    }
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload: {
    userId: string;
    phone: string;
    email?: string;
  }): string {
    const options = {
      expiresIn: this.accessTokenExpiry,
      issuer: 'comedyinsight-api',
      audience: 'comedyinsight-mobile',
    } as SignOptions;
    return jwt.sign(payload, this.secret, options);
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId: string): string {
    const options = {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'comedyinsight-api',
    } as SignOptions;
    return jwt.sign({ userId }, this.secret, options);
  }

  /**
   * Verify and decode access token
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'comedyinsight-api',
        audience: 'comedyinsight-mobile',
      }) as JwtPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError('Token expired', 'TOKEN_EXPIRED', 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthError('Invalid token', 'INVALID_TOKEN', 401);
      }
      throw new AuthError('Token verification failed', 'TOKEN_ERROR', 401);
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'comedyinsight-api',
      }) as { userId: string };
      return decoded;
    } catch (error) {
      throw new AuthError('Invalid refresh token', 'INVALID_REFRESH_TOKEN', 401);
    }
  }

  /**
   * Get token expiry in seconds
   */
  getExpiresIn(): number {
    // Parse "7d" to seconds
    const match = this.accessTokenExpiry.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60; // Default 7 days

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 7 * 24 * 60 * 60;
    }
  }
}

// Singleton instance
export const jwtService = new JWTService();

