/**
 * Integration Tests - Auth Endpoints
 */

import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import { createAuthRoutes } from '../../server/src/routes/auth.routes';

describe('Auth API Integration Tests', () => {
  let app: express.Application;
  let db: Pool;

  beforeAll(() => {
    // Setup test database
    db = new Pool({
      user: 'test',
      host: 'localhost',
      database: 'comedyinsight_test',
      password: 'test',
      port: 5432,
    });

    app = express();
    app.use(express.json());
    app.use('/auth', createAuthRoutes(db));
  });

  afterAll(async () => {
    await db.end();
  });

  describe('POST /auth/send-otp', () => {
    it('should send OTP for valid phone number', async () => {
      const response = await request(app)
        .post('/auth/send-otp')
        .send({ phone: '+1234567890' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('OTP sent');
    });

    it('should reject invalid phone number', async () => {
      const response = await request(app)
        .post('/auth/send-otp')
        .send({ phone: 'invalid' });

      expect(response.status).toBe(400);
    });

    it('should rate limit after 5 requests', async () => {
      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/send-otp')
          .send({ phone: '+1234567890' });
      }

      // 6th request should be rate limited
      const response = await request(app)
        .post('/auth/send-otp')
        .send({ phone: '+1234567890' });

      expect(response.status).toBe(429);
    });
  });

  describe('POST /auth/verify-otp', () => {
    it('should verify valid OTP', async () => {
      // Send OTP first
      await request(app)
        .post('/auth/send-otp')
        .send({ phone: '+1234567890' });

      // Get OTP from database (test only)
      const otpResult = await db.query(
        'SELECT otp_code FROM phone_otps WHERE phone = $1 ORDER BY created_at DESC LIMIT 1',
        ['+1234567890']
      );

      const response = await request(app)
        .post('/auth/verify-otp')
        .send({
          phone: '+1234567890',
          otp: otpResult.rows[0].otp_code,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid OTP', async () => {
      const response = await request(app)
        .post('/auth/verify-otp')
        .send({
          phone: '+1234567890',
          otp: 'wrong-otp',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/oauth', () => {
    it('should handle OAuth login', async () => {
      const response = await request(app)
        .post('/auth/oauth')
        .send({
          provider: 'google',
          access_token: 'mock-google-token',
        });

      // Mock OAuth response
      expect(response.status).toBe(200);
    });
  });

  describe('POST /auth/logout', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/auth/logout');

      expect(response.status).toBe(401);
    });

    it('should logout authenticated user', async () => {
      // Get valid token first
      const token = 'valid-test-token'; // Mock

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });
  });
});

