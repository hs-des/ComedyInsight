/**
 * Fake Views Types
 */

export interface FakeViewCampaign {
  id: string;
  video_id: string;
  total_count: number;
  executed_count: number;
  remaining_count: number;
  duration_days: number;
  pattern: 'burst' | 'steady';
  daily_limit: number;
  status: 'pending' | 'running' | 'completed' | 'paused' | 'cancelled';
  started_at?: Date;
  ended_at?: Date;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

export interface FakeViewCampaignCreate {
  video_id: string;
  total_count: number;
  duration_days: number;
  pattern: 'burst' | 'steady';
  daily_limit: number;
}

export interface FakeViewJob {
  campaign_id: string;
  video_id: string;
  views_to_add: number;
  batch_number: number;
}

export interface ViewDistribution {
  daily_views: number;
  distribution: number[]; // Views per day array
}

export interface CampaignLimits {
  max_per_day: number;
  global_monthly_cap: number;
  current_month_total: number;
}

export interface CampaignStatus {
  campaign: FakeViewCampaign;
  progress: number;
  estimated_completion?: Date;
  logs: CampaignLog[];
}

export interface CampaignLog {
  id: string;
  campaign_id: string;
  action: string;
  details: Record<string, any>;
  created_at: Date;
}

