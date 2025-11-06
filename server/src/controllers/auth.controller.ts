/**
 * Auth Controller - Handle authentication endpoints
 */

import { Request, Response } from 'express';
import { Pool } from 'pg';
import { OTPService } from '../services/otp.service';
import { OAuthService } from '../services/oauth.service';
import { jwtService } from '../services/jwt.service';
import { UserRepository } from '../repositories/user.repository';
import {
  SendOtpRequest,
  VerifyOtpRequest,
  OAuthRequest,
  AuthError,
  OtpSentResponse,
  AuthResponse,
  OAuthProvider,
} from '../types/auth.types';
import { auditLogger } from '../middleware/audit.middleware';

export class AuthController {
  private otpService: OTPService;
  private oauthService: OAuthService;
  private userRepository: UserRepository;

  constructor(db: Pool) {
    this.otpService = new OTPService(db);
    this.oauthService = new OAuthService(db);
    this.userRepository = new UserRepository(db);
  }

  /**
   * POST /auth/send-otp
   * Send OTP to phone number
   */
  sendOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const { phone } = req.body as SendOtpRequest;

      // Validate input
      if (!phone) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Phone number is required',
        });
        return;
      }

      // Send OTP
      const result = await this.otpService.sendOTP(phone);

      // Log audit
      await auditLogger.logAuthAction('SEND_OTP', { phone });

      const response: OtpSentResponse = {
        message: `OTP sent to ${phone}`,
        expires_in: result.expires_in,
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * POST /auth/verify-otp
   * Verify OTP and return JWT tokens
   */
  verifyOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const { phone, otp_code } = req.body as VerifyOtpRequest;

      // Validate input
      if (!phone || !otp_code) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Phone number and OTP code are required',
        });
        return;
      }

      // Verify OTP
      await this.otpService.verifyOTP(phone, otp_code);

      // Find or create user
      let user = await this.userRepository.findByPhone(phone);
      if (!user) {
        user = await this.userRepository.create({ phone });
      }

      // Update last login
      await this.userRepository.updateLastLogin(user.id);

      // Generate JWT tokens
      const accessToken = jwtService.generateAccessToken({
        userId: user.id,
        phone: user.phone!,
        email: user.email,
      });

      const refreshToken = jwtService.generateRefreshToken(user.id);

      // Log audit
      await auditLogger.logAuthAction('VERIFY_OTP', { userId: user.id });

      const response: AuthResponse = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: jwtService.getExpiresIn(),
        user: this.userRepository.toUserResponse(user),
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * POST /auth/oauth
   * Authenticate via OAuth provider
   */
  oauthLogin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { provider, access_token, id_token } = req.body as OAuthRequest;

      // Validate input
      if (!provider || !access_token) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Provider and access_token are required',
        });
        return;
      }

      // Convert string provider to OAuthProvider enum
      let oauthProvider: OAuthProvider;
      if (provider === 'google') {
        oauthProvider = OAuthProvider.GOOGLE;
      } else if (provider === 'apple') {
        oauthProvider = OAuthProvider.APPLE;
      } else if (provider === 'facebook') {
        oauthProvider = OAuthProvider.FACEBOOK;
      } else {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid OAuth provider',
        });
        return;
      }

      // Verify provider token
      const providerInfo = await this.oauthService.verifyProviderToken(
        oauthProvider,
        access_token,
        id_token
      );

      // Find or create OAuth account and user
      const userId = await this.oauthService.findOrCreateOAuthAccount(
        oauthProvider,
        providerInfo,
        access_token
      );

      // Get user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AuthError('User not found', 'USER_NOT_FOUND', 404);
      }

      // Update last login
      await this.userRepository.updateLastLogin(user.id);

      // Generate JWT tokens
      const accessToken = jwtService.generateAccessToken({
        userId: user.id,
        phone: user.phone || '',
        email: user.email,
      });

      const refreshToken = jwtService.generateRefreshToken(user.id);

      // Log audit
      await auditLogger.logAuthAction('OAUTH_LOGIN', {
        userId: user.id,
        provider,
      });

      const response: AuthResponse = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: jwtService.getExpiresIn(),
        user: this.userRepository.toUserResponse(user),
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * POST /auth/logout
   * Logout user (invalidate tokens)
   * Note: With JWT, logout is client-side (token deletion)
   * Could implement token blacklist in Redis for server-side logout
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      // Extract user from request (added by auth middleware)
      const userId = (req as any).user?.userId;

      // Log audit if user is authenticated
      if (userId) {
        await auditLogger.logAuthAction('LOGOUT', { userId });
      }

      res.status(200).json({
        message: 'Logged out successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Handle errors
   */
  private handleError(error: unknown, res: Response): void {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
      });
    } else {
      console.error('Auth error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      });
    }
  }
}

