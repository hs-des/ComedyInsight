/**
 * Ads Controller
 */

import { Request, Response } from 'express';
import { Pool } from 'pg';

export class AdsController {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Get ads by position
   */
  getAds = async (req: Request, res: Response) => {
    const { position, user_id, device_type } = req.query;

    try {
      let query = `
        SELECT 
          id, title, ad_type, position, ad_url, image_url, video_url,
          click_url, target_demographics, metadata
        FROM ads
        WHERE is_active = true
          AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
          AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
      `;

      const values: any[] = [];
      let paramIndex = 1;

      // Filter by position if provided
      if (position && typeof position === 'string') {
        query += ` AND position = $${paramIndex++}`;
        values.push(position);
      }

      // Apply targeting if user data provided
      if (user_id) {
        // Could add user-based targeting here
        // For now, get all matching ads
      }

      query += ' ORDER BY created_at DESC LIMIT 10';

      const result = await this.db.query(query, values);

      res.json({
        ads: result.rows,
        count: result.rows.length,
      });
    } catch (error: any) {
      console.error('Error fetching ads:', error);
      res.status(500).json({ message: error.message });
    }
  };

  /**
   * Track ad impression
   */
  trackImpression = async (req: Request, res: Response) => {
    const { ad_id, user_id, device_type, platform } = req.body;

    try {
      await this.db.query(
        `
        INSERT INTO ad_impressions (ad_id, user_id, device_type, platform, created_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        `,
        [ad_id, user_id || null, device_type || 'unknown', platform || 'mobile']
      );

      // Update impression count on ads table
      await this.db.query(
        `
        UPDATE ads
        SET current_impressions = COALESCE(current_impressions, 0) + 1
        WHERE id = $1
        `,
        [ad_id]
      );

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error tracking impression:', error);
      res.status(500).json({ message: error.message });
    }
  };

  /**
   * Track ad click
   */
  trackClick = async (req: Request, res: Response) => {
    const { ad_id, user_id, device_type, platform } = req.body;

    try {
      await this.db.query(
        `
        INSERT INTO ad_clicks (ad_id, user_id, device_type, platform, created_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        `,
        [ad_id, user_id || null, device_type || 'unknown', platform || 'mobile']
      );

      // Update click count on ads table
      await this.db.query(
        `
        UPDATE ads
        SET current_clicks = COALESCE(current_clicks, 0) + 1
        WHERE id = $1
        `,
        [ad_id]
      );

      // Get click URL
      const result = await this.db.query(
        'SELECT click_url FROM ads WHERE id = $1',
        [ad_id]
      );

      const clickUrl = result.rows[0]?.click_url || null;

      res.json({
        success: true,
        click_url: clickUrl,
      });
    } catch (error: any) {
      console.error('Error tracking click:', error);
      res.status(500).json({ message: error.message });
    }
  };

  /**
   * Get ad analytics
   */
  getAnalytics = async (req: Request, res: Response) => {
    const { ad_id, start_date, end_date } = req.query;

    try {
      let query = `
        SELECT 
          a.id,
          a.title,
          a.current_impressions as impressions,
          a.current_clicks as clicks,
          COALESCE(ROUND(100.0 * a.current_clicks / NULLIF(a.current_impressions, 0), 2), 0) as ctr,
          (SELECT COUNT(*) FROM ad_impressions WHERE ad_id = a.id 
            AND created_at >= COALESCE($1, CURRENT_DATE - INTERVAL '30 days')) as impressions_period,
          (SELECT COUNT(*) FROM ad_clicks WHERE ad_id = a.id 
            AND created_at >= COALESCE($1, CURRENT_DATE - INTERVAL '30 days')) as clicks_period
        FROM ads a
        WHERE a.is_active = true
      `;

      const values: any[] = [start_date || null];
      let paramIndex = 2;

      if (ad_id) {
        query += ` AND a.id = $${paramIndex++}`;
        values.push(ad_id);
      }

      query += ' ORDER BY a.created_at DESC';

      const result = await this.db.query(query, values);

      res.json({
        analytics: result.rows,
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ message: error.message });
    }
  };
}

