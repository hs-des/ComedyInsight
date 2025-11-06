/**
 * Ads Routes
 */

import { Router } from 'express';
import { Pool } from 'pg';
import { AdsController } from '../controllers/ads.controller';

export const createAdsRoutes = (db: Pool): Router => {
  const router = Router();
  const adsController = new AdsController(db);

  // Get ads by position
  router.get('/ads', adsController.getAds);

  // Track ad impression
  router.post('/ads/track/impression', adsController.trackImpression);

  // Track ad click
  router.post('/ads/track/click', adsController.trackClick);

  // Get ad analytics
  router.get('/ads/analytics', adsController.getAnalytics);

  return router;
};

