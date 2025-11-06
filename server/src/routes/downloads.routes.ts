/**
 * Downloads Routes
 */

import { Router } from 'express';
import { Pool } from 'pg';
import { DownloadsController } from '../controllers/downloads.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { body } from 'express-validator';

export const createDownloadsRoutes = (db: Pool): Router => {
  const router = Router();
  const downloadsController = new DownloadsController(db);

  // Validation middleware
  const requestDownloadValidation = [
    body('video_id').isUUID().withMessage('Video ID must be valid UUID'),
    body('quality').optional().isIn(['360p', '480p', '720p', '1080p']).withMessage('Invalid quality'),
    body('device_id').optional().isString(),
  ];

  // Request download
  router.post(
    '/downloads/request',
    authenticateToken,
    validate(requestDownloadValidation),
    downloadsController.requestDownload
  );

  // Verify token
  router.post(
    '/downloads/verify-token',
    authenticateToken,
    downloadsController.verifyToken
  );

  // Revoke own downloads
  router.post(
    '/downloads/revoke',
    authenticateToken,
    downloadsController.revokeDownloads
  );

  // Admin: revoke user downloads
  router.post(
    '/admin/downloads/revoke',
    authenticateToken,
    downloadsController.adminRevokeDownloads
  );

  return router;
};

