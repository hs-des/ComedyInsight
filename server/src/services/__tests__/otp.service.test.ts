/**
 * OTP Service Unit Tests
 */

import { Pool } from 'pg';
import { OTPService } from '../otp.service';
import { RateLimitError, OtpExpiredError, InvalidOtpError } from '../../types/auth.types';

// Mock database
jest.mock('pg');

describe('OTPService', () => {
  let pool: jest.Mocked<Pool>;
  let otpService: OTPService;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockQuery = jest.fn();
    pool = {
      query: mockQuery,
    } as any;

    otpService = new OTPService(pool);
  });

  describe('sendOTP', () => {
    it('should successfully send OTP when rate limit allows', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ count: '0' }],
        })
        .mockResolvedValueOnce({
          rows: [{ created_at: new Date() }],
        })
        .mockResolvedValueOnce({
          rows: [{
            id: '123',
            phone: '+1234567890',
            otp_code: '123456',
            is_verified: false,
            expires_at: new Date(),
            attempt_count: 0,
            max_attempts: 3,
            created_at: new Date(),
          }],
        });

      const result = await otpService.sendOTP('+1234567890');

      expect(result.expires_in).toBe(300); // 5 minutes
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it('should throw RateLimitError when limit exceeded', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: '5' }],
      });

      await expect(otpService.sendOTP('+1234567890')).rejects.toThrow(RateLimitError);
    });
  });

  describe('verifyOTP', () => {
    it('should successfully verify valid OTP', async () => {
      const futureExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            id: '123',
            phone: '+1234567890',
            otp_code: '123456',
            is_verified: false,
            expires_at: futureExpiry,
            attempt_count: 0,
            max_attempts: 3,
            created_at: new Date(),
          }],
        })
        .mockResolvedValueOnce({ rows: [] });

      const result = await otpService.verifyOTP('+1234567890', '123456');

      expect(result.is_verified).toBe(true);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should throw InvalidOtpError for invalid code', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(otpService.verifyOTP('+1234567890', 'invalid')).rejects.toThrow(InvalidOtpError);
    });

    it('should throw OtpExpiredError for expired code', async () => {
      const pastExpiry = new Date(Date.now() - 1000); // 1 second ago

      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: '123',
          phone: '+1234567890',
          otp_code: '123456',
          is_verified: false,
          expires_at: pastExpiry,
          attempt_count: 0,
          max_attempts: 3,
          created_at: new Date(),
        }],
      });

      await expect(otpService.verifyOTP('+1234567890', '123456')).rejects.toThrow(OtpExpiredError);
    });
  });

  describe('checkRateLimit', () => {
    it('should return allowed: true when under limit', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: '2' }],
      });

      const result = await otpService['checkRateLimit']('+1234567890');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3);
    });

    it('should return allowed: false when limit reached', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ count: '5' }],
        })
        .mockResolvedValueOnce({
          rows: [{ created_at: new Date() }],
        });

      const result = await otpService['checkRateLimit']('+1234567890');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });
});

