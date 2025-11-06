/**
 * Fake Views Repository
 */

import { Pool } from 'pg';
import { FakeViewCampaign, FakeViewJob, CampaignLog } from '../types/fake-views.types';

export class FakeViewsRepository {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async create(campaign: Omit<FakeViewCampaign, 'id' | 'created_at' | 'updated_at' | 'ended_at'>): Promise<FakeViewCampaign> {
    const query = `
      INSERT INTO fake_views_logs (
        video_id, fake_views_count, executed_count, remaining_count, duration_days,
        pattern, daily_limit, status, started_at, created_by, request_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'boost')
      RETURNING *;
    `;
    const values = [
      campaign.video_id,
      campaign.total_count,
      campaign.executed_count,
      campaign.remaining_count,
      campaign.duration_days,
      campaign.pattern,
      campaign.daily_limit,
      campaign.status,
      campaign.started_at,
      campaign.created_by,
    ];
    const result = await this.db.query<FakeViewCampaign>(query, values);
    // Map fake_views_count to total_count for interface compatibility
    const row = result.rows[0] as any;
    return { ...row, total_count: row.fake_views_count };
  }

  async findById(id: string): Promise<FakeViewCampaign | null> {
    const query = 'SELECT * FROM fake_views_logs WHERE id = $1';
    const result = await this.db.query<any>(query, [id]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return { ...row, total_count: row.fake_views_count };
  }

  async findAll(): Promise<FakeViewCampaign[]> {
    try {
      const query = 'SELECT * FROM fake_views_logs ORDER BY created_at DESC';
      const result = await this.db.query<any>(query);
      return result.rows.map((row: any) => ({ ...row, total_count: row.fake_views_count }));
    } catch (error: any) {
      // Handle table not existing
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('fake_views_logs table not found, returning empty array');
        return [];
      }
      throw error;
    }
  }

  async findByVideoId(videoId: string): Promise<FakeViewCampaign[]> {
    const query = 'SELECT * FROM fake_views_logs WHERE video_id = $1 ORDER BY created_at DESC';
    const result = await this.db.query<any>(query, [videoId]);
    return result.rows.map((row: any) => ({ ...row, total_count: row.fake_views_count }));
  }

  async updateStatus(id: string, status: string, endedAt?: Date): Promise<FakeViewCampaign | null> {
    const query = `
      UPDATE fake_views_logs
      SET status = $2, ended_at = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    const result = await this.db.query<any>(query, [id, status, endedAt]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return { ...row, total_count: row.fake_views_count };
  }

  async incrementExecutedCount(id: string, count: number): Promise<void> {
    const query = `
      UPDATE fake_views_logs
      SET executed_count = executed_count + $2,
          remaining_count = GREATEST(0, remaining_count - $2),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1;
    `;
    await this.db.query(query, [id, count]);
  }

  async addViewToVideo(videoId: string, count: number): Promise<void> {
    const query = `
      UPDATE videos
      SET boosted_view_count = boosted_view_count + $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1;
    `;
    await this.db.query(query, [videoId, count]);
  }

  async getGlobalMonthlyCount(): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(executed_count), 0) as total
      FROM fake_views_logs
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);
    `;
    const result = await this.db.query<{ total: string }>(query);
    return parseInt(result.rows[0].total, 10);
  }

  async getCampaignsByStatus(status: string): Promise<FakeViewCampaign[]> {
    const query = 'SELECT * FROM fake_views_logs WHERE status = $1';
    const result = await this.db.query<any>(query, [status]);
    return result.rows.map((row: any) => ({ ...row, total_count: row.fake_views_count }));
  }

  async addLog(campaignId: string, action: string, details: Record<string, any>): Promise<void> {
    const query = `
      INSERT INTO audit_logs (action, details, metadata)
      VALUES ($1, $2, jsonb_build_object('campaign_id', $3));
    `;
    await this.db.query(query, [action, details, campaignId]);
  }
}

