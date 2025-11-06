/**
 * Fake Views Service - Business logic for view campaigns
 */

import { Pool } from 'pg';
import { FakeViewsRepository } from '../repositories/fake-views.repository';
import { FakeViewCampaignCreate, ViewDistribution, CampaignLimits } from '../types/fake-views.types';

const DEFAULT_LIMITS: CampaignLimits = {
  max_per_day: 100000,
  global_monthly_cap: 5000000,
  current_month_total: 0,
};

export class FakeViewsService {
  private repository: FakeViewsRepository;

  constructor(db: Pool) {
    this.repository = new FakeViewsRepository(db);
  }

  /**
   * Calculate view distribution over duration
   */
  calculateDistribution(
    totalCount: number,
    durationDays: number,
    pattern: 'burst' | 'steady',
    dailyLimit: number
  ): ViewDistribution {
    const totalDays = durationDays;
    let distribution: number[] = [];

    if (pattern === 'steady') {
      // Even distribution
      const dailyAverage = Math.floor(totalCount / totalDays);
      const remainder = totalCount % totalDays;

      distribution = Array(totalDays).fill(dailyAverage);
      distribution[totalDays - 1] += remainder;
    } else {
      // Burst pattern: more views at start
      for (let i = 0; i < totalDays; i++) {
        const factor = 1 - i / totalDays; // Decrease over time
        const baseViews = Math.floor((totalCount * factor) / totalDays);
        distribution.push(baseViews);
      }

      // Normalize to exact total
      const currentTotal = distribution.reduce((sum, val) => sum + val, 0);
      const diff = totalCount - currentTotal;
      distribution[0] += diff;
    }

    // Enforce daily limit
    distribution = distribution.map((count) => Math.min(count, dailyLimit));

    // Renormalize if we capped
    const cappedTotal = distribution.reduce((sum, val) => sum + val, 0);
    if (cappedTotal < totalCount) {
      const deficit = totalCount - cappedTotal;
      // Try to distribute deficit
      for (let i = 0; i < deficit && i < distribution.length; i++) {
        distribution[i] += 1;
      }
    }

    return {
      daily_views: Math.max(...distribution),
      distribution,
    };
  }

  /**
   * Validate campaign limits
   */
  async validateLimits(data: FakeViewCampaignCreate): Promise<void> {
    // Check daily limit
    if (data.daily_limit > DEFAULT_LIMITS.max_per_day) {
      throw new Error(`Daily limit exceeds maximum of ${DEFAULT_LIMITS.max_per_day}`);
    }

    // Check estimated total
    const estimatedTotal = data.daily_limit * data.duration_days;
    if (estimatedTotal < data.total_count) {
      throw new Error('Daily limit cannot satisfy total count over duration');
    }

    // Check global monthly cap
    const currentMonthly = await this.repository.getGlobalMonthlyCount();
    if (currentMonthly + data.total_count > DEFAULT_LIMITS.global_monthly_cap) {
      throw new Error('Campaign would exceed global monthly cap');
    }
  }

  /**
   * Create a new campaign
   */
  async createCampaign(
    data: FakeViewCampaignCreate,
    createdBy: string
  ): Promise<FakeViewCampaignCreate & { id: string; distribution: ViewDistribution }> {
    // Validate
    await this.validateLimits(data);

    // Calculate distribution
    const distribution = this.calculateDistribution(
      data.total_count,
      data.duration_days,
      data.pattern,
      data.daily_limit
    );

    // Create campaign
    const campaign = await this.repository.create({
      video_id: data.video_id,
      total_count: data.total_count,
      executed_count: 0,
      remaining_count: data.total_count,
      duration_days: data.duration_days,
      pattern: data.pattern,
      daily_limit: data.daily_limit,
      status: 'pending',
      started_at: undefined,
      created_by: createdBy,
    });

    return {
      ...campaign,
      distribution,
    } as any;
  }

  /**
   * Get safety limits
   */
  getLimits(): CampaignLimits {
    return DEFAULT_LIMITS;
  }

  /**
   * Get all campaigns
   */
  async getAllCampaigns() {
    return this.repository.findAll();
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(id: string) {
    return this.repository.findById(id);
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(id: string, status: string) {
    return this.repository.updateStatus(id, status);
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(id: string) {
    await this.updateCampaignStatus(id, 'paused');
  }

  /**
   * Cancel campaign
   */
  async cancelCampaign(id: string) {
    await this.repository.updateStatus(id, 'cancelled', new Date());
  }

  /**
   * Get current monthly count
   */
  async getCurrentMonthlyCount(): Promise<number> {
    return this.repository.getGlobalMonthlyCount();
  }
}

