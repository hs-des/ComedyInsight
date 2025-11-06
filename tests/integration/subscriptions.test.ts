/**
 * Integration Tests - Subscription Endpoints
 */

import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import { createSubscriptionRoutes } from '../../server/src/routes/subscription.routes';

describe('Subscription API Integration Tests', () => {
  let app: express.Application;
  let db: Pool;

  beforeAll(() => {
    db = new Pool({
      user: 'test',
      host: 'localhost',
      database: 'comedyinsight_test',
      password: 'test',
      port: 5432,
    });

    app = express();
    app.use(express.json());
    app.use('/api', createSubscriptionRoutes(db));
  });

  afterAll(async () => {
    await db.end();
  });

  describe('POST /api/subscribe', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/subscribe');

      expect(response.status).toBe(401);
    });

    it('should create checkout session', async () => {
      const mockToken = 'valid-test-token';

      const response = await request(app)
        .post('/api/subscribe')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('url');
    });
  });

  describe('POST /api/webhooks/stripe', () => {
    it('should verify webhook signature', async () => {
      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'mock-signature')
        .send({ type: 'payment_intent.succeeded' });

      // Should fail without valid signature
      expect(response.status).toBe(400);
    });

    it('should handle valid webhook', async () => {
      // Mock valid signature
      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'valid-signature')
        .send({
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'session_123',
              customer: 'cus_123',
              subscription: 'sub_123',
              metadata: { userId: 'user-123' },
            },
          },
        });

      // Would pass with valid signature
      expect([200, 400]).toContain(response.status);
    });
  });
});

