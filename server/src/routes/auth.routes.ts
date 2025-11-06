/**
 * Auth Routes - Authentication endpoints
 */

import { Router } from 'express';
import { Pool } from 'pg';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { sanitizeBody } from '../middleware/validation.middleware';

export const createAuthRoutes = (db: Pool): Router => {
  const router = Router();
  const authController = new AuthController(db);

  // Public routes
  router.post('/send-otp', sanitizeBody, authController.sendOtp);
  router.post('/verify-otp', sanitizeBody, authController.verifyOtp);
  router.post('/oauth', sanitizeBody, authController.oauthLogin);

  // Protected routes
  router.post('/logout', authenticateToken, authController.logout);

  return router;
};

