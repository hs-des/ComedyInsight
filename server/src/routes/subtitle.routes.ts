/**
 * Subtitle Routes - Subtitle endpoints
 */

import { Router } from 'express';
import { Pool } from 'pg';
import { SubtitleController } from '../controllers/subtitle.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { uploadSubtitle } from '../middleware/upload.middleware';

export const createSubtitleRoutes = (db: Pool): Router => {
  const router = Router();
  const subtitleController = new SubtitleController(db);

  // Public route - Get subtitles for a video
  router.get('/videos/:videoId/subtitles', subtitleController.getSubtitles);

  // Admin routes - Require authentication
  router.post(
    '/admin/videos/:video_id/subtitles',
    authenticateToken,
    uploadSubtitle,
    subtitleController.uploadSubtitle
  );

  router.post(
    '/admin/subtitles/validate',
    authenticateToken,
    uploadSubtitle,
    subtitleController.validateSubtitle
  );

  router.put(
    '/admin/subtitles/:id',
    authenticateToken,
    subtitleController.updateSubtitle
  );

  router.delete(
    '/admin/subtitles/:id',
    authenticateToken,
    subtitleController.deleteSubtitle
  );

  return router;
};

