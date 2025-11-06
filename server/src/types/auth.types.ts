/**
 * Authentication module types and interfaces
 */

export interface SendOtpRequest {
  phone: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otp_code: string;
}

export interface OAuthRequest {
  provider: 'google' | 'apple' | 'facebook';
  access_token: string;
  id_token?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  user: UserResponse;
}

export interface UserResponse {
  id: string;
  username?: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  is_verified: boolean;
}

export interface OtpSentResponse {
  message: string;
  expires_in: number;
}

export interface OTPRecord {
  id: string;
  phone: string;
  otp_code: string;
  is_verified: boolean;
  expires_at: Date;
  attempt_count: number;
  max_attempts: number;
  created_at: Date;
}

export interface OAuthProviderInfo {
  provider_user_id: string;
  email?: string;
  name?: string;
  picture?: string;
  verified?: boolean;
}

export interface OAuthConfig {
  google: {
    clientId: string;
    tokenInfoUrl: string;
  };
  apple: {
    clientId: string;
    issuer: string;
  };
  facebook: {
    appId: string;
    tokenInfoUrl: string;
  };
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export interface UserRecord {
  id: string;
  username?: string;
  email?: string;
  phone: string;
  password_hash?: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  bio?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface JwtPayload {
  userId: string;
  phone: string;
  email?: string;
  iat: number;
  exp: number;
}

export enum OAuthProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
  FACEBOOK = 'facebook',
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class RateLimitError extends AuthError {
  constructor(resetAt: Date) {
    super(
      'Too many OTP requests. Please try again later.',
      'RATE_LIMIT_EXCEEDED',
      429
    );
  }
}

export class OtpExpiredError extends AuthError {
  constructor() {
    super('OTP code has expired', 'OTP_EXPIRED', 400);
  }
}

export class InvalidOtpError extends AuthError {
  constructor() {
    super('Invalid OTP code', 'INVALID_OTP', 401);
  }
}

export class MaxAttemptsError extends AuthError {
  constructor() {
    super(
      'Maximum verification attempts exceeded',
      'MAX_ATTEMPTS_EXCEEDED',
      429
    );
  }
}

