/**
 * Fake Views Routes
 */

import { Router } from 'express';
import { Pool } from 'pg';
import { FakeViewsController } from '../controllers/fake-views.controller';
import { authenticateToken as authenticateJwt } from '../middleware/auth.middleware';
import { getViewQueue } from '../queue/queue-setup';
import { validate } from '../middleware/validation.middleware';
import { body, param } from 'express-validator';

export const createFakeViewsRoutes = (db: Pool): Router => {
  const router = Router();
  const viewQueue = getViewQueue();
  const fakeViewsController = new FakeViewsController(db, viewQueue);

  // Validation middleware
  const createCampaignValidation = [
    body('video_id').isUUID().withMessage('Video ID must be valid UUID'),
    body('total_count').isInt({ min: 1 }).withMessage('Total count must be positive'),
    body('duration_days').isInt({ min: 1, max: 365 }).withMessage('Duration must be 1-365 days'),
    body('pattern').isIn(['burst', 'steady']).withMessage('Pattern must be burst or steady'),
    body('daily_limit').isInt({ min: 1 }).withMessage('Daily limit must be positive'),
  ];

  const uuidParamValidation = [
    param('id').isUUID().withMessage('Campaign ID must be valid UUID'),
  ];

  // Routes
  router.post(
    '/admin/fake-views',
    authenticateJwt, // Admin only
    validate(createCampaignValidation),
    fakeViewsController.createCampaign
  );

  router.get(
    '/admin/fake-views',
    authenticateJwt,
    fakeViewsController.getAllCampaigns
  );

  router.get(
    '/admin/fake-views/:id',
    authenticateJwt,
    validate(uuidParamValidation),
    fakeViewsController.getCampaignById
  );

  router.post(
    '/admin/fake-views/:id/execute',
    authenticateJwt,
    validate(uuidParamValidation),
    fakeViewsController.executeCampaign
  );

  router.post(
    '/admin/fake-views/:id/pause',
    authenticateJwt,
    validate(uuidParamValidation),
    fakeViewsController.pauseCampaign
  );

  router.post(
    '/admin/fake-views/:id/cancel',
    authenticateJwt,
    validate(uuidParamValidation),
    fakeViewsController.cancelCampaign
  );

  router.get(
    '/admin/fake-views/limits',
    authenticateJwt,
    fakeViewsController.getLimits
  );

  return router;
};

