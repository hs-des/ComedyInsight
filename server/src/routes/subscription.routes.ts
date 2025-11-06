/**
 * Subscription Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import express from 'express';

export const createSubscriptionRoutes = (db: Pool): Router => {
  const router = Router();
  const subscriptionController = new SubscriptionController(db);

  // Create checkout session
  router.post(
    '/subscribe',
    authenticateToken,
    subscriptionController.createCheckout
  );

  // Webhook endpoint (no auth, verified by signature)
  // Must use raw body for signature verification
  router.post(
    '/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    subscriptionController.handleWebhook
  );

  return router;
};

