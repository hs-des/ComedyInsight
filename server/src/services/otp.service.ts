/**
 * OTP Service - Generate, send, and verify OTP codes
 */

import { Pool } from 'pg';
import { SMSService, smsService } from './sms.service';
import {
  RateLimitResult,
  RateLimitError,
  OtpExpiredError,
  InvalidOtpError,
  MaxAttemptsError,
  OTPRecord,
} from '../types/auth.types';

export class OTPService {
  private db: Pool;
  private smsService: SMSService;
  private otpExpiryMinutes: number = 5;
  private maxOtpRequestsPerHour: number = 5;
  private maxAttempts: number = 3;

  constructor(db: Pool, smsServiceInstance?: SMSService) {
    this.db = db;
    this.smsService = smsServiceInstance || smsService;
  }

  /**
   * Generate a random 6-digit OTP code
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Check rate limit for phone number
   */
  async checkRateLimit(phone: string): Promise<RateLimitResult> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await this.db.query<{ count: string }>(
      `
      SELECT COUNT(*) as count
      FROM phone_otps
      WHERE phone = $1 
        AND created_at > $2
        AND (is_verified = true OR attempt_count >= $3)
      `,
      [phone, oneHourAgo, this.maxAttempts]
    );

    const count = parseInt(result.rows[0]?.count || '0', 10);
    const remaining = Math.max(0, this.maxOtpRequestsPerHour - count);
    const allowed = remaining > 0;

    // Calculate reset time (1 hour from first request in current window)
    const firstRequestResult = await this.db.query<{ created_at: Date }>(
      `
      SELECT MIN(created_at) as created_at
      FROM phone_otps
      WHERE phone = $1 
        AND created_at > $2
      `,
      [phone, oneHourAgo]
    );

    const resetAt = firstRequestResult.rows[0]?.created_at
      ? new Date(
          new Date(firstRequestResult.rows[0].created_at).getTime() +
            60 * 60 * 1000
        )
      : new Date(Date.now() + 60 * 60 * 1000);

    return { allowed, remaining, resetAt };
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(phone: string): Promise<{ expires_in: number }> {
    // Sanitize phone number
    const sanitizedPhone = this.sanitizePhone(phone);

    // Check rate limit
    const rateLimit = await this.checkRateLimit(sanitizedPhone);
    if (!rateLimit.allowed) {
      throw new RateLimitError(rateLimit.resetAt);
    }

    // Generate OTP
    const otpCode = this.generateOTP();

    // Calculate expiry
    const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);

    // Save to database
    const result = await this.db.query<OTPRecord>(
      `
      INSERT INTO phone_otps (phone, otp_code, expires_at, max_attempts)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [sanitizedPhone, otpCode, expiresAt, this.maxAttempts]
    );

    // Send SMS
    try {
      await this.smsService.sendOTP(sanitizedPhone, otpCode);
    } catch (error) {
      console.error('Failed to send SMS:', error);
      // Don't throw - OTP is saved, user could retry
    }

    return {
      expires_in: this.otpExpiryMinutes * 60,
    };
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(phone: string, otpCode: string): Promise<OTPRecord> {
    const sanitizedPhone = this.sanitizePhone(phone);

    // Find unverified OTP
    const result = await this.db.query<OTPRecord>(
      `
      SELECT *
      FROM phone_otps
      WHERE phone = $1 
        AND otp_code = $2 
        AND is_verified = false
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [sanitizedPhone, otpCode]
    );

    const otpRecord = result.rows[0];
    if (!otpRecord) {
      // Increment attempt count on all recent OTPs for this phone
      await this.incrementAttempts(sanitizedPhone);
      throw new InvalidOtpError();
    }

    // Check if expired
    if (new Date() > otpRecord.expires_at) {
      await this.incrementAttempts(sanitizedPhone);
      throw new OtpExpiredError();
    }

    // Check if max attempts exceeded
    if (otpRecord.attempt_count >= otpRecord.max_attempts) {
      throw new MaxAttemptsError();
    }

    // Mark as verified
    await this.db.query(
      `
      UPDATE phone_otps
      SET is_verified = true
      WHERE id = $1
      `,
      [otpRecord.id]
    );

    return { ...otpRecord, is_verified: true };
  }

  /**
   * Increment attempt count for all recent OTPs
   */
  private async incrementAttempts(phone: string): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    await this.db.query(
      `
      UPDATE phone_otps
      SET attempt_count = attempt_count + 1
      WHERE phone = $1 
        AND created_at > $2
        AND is_verified = false
      `,
      [phone, oneHourAgo]
    );
  }

  /**
   * Sanitize phone number to E.164 format
   */
  private sanitizePhone(phone: string): string {
    // Remove all non-digit characters except +
    let sanitized = phone.replace(/[^\d+]/g, '');

    // Add + if not present and ensure US format for now
    if (!sanitized.startsWith('+')) {
      sanitized = `+1${sanitized}`;
    }

    // Validate E.164 format
    if (!/^\+[1-9]\d{1,14}$/.test(sanitized)) {
      throw new Error('Invalid phone number format');
    }

    return sanitized;
  }

  /**
   * Clean up expired OTPs (can be called by a cron job)
   */
  async cleanupExpiredOTPs(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await this.db.query(
      `
      DELETE FROM phone_otps
      WHERE created_at < $1
      `,
      [oneDayAgo]
    );
  }
}

