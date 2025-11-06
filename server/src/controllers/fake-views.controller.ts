/**
 * Fake Views Controller
 */

import { Request, Response } from 'express';
import { Pool } from 'pg';
import { FakeViewsService } from '../services/fake-views.service';
import { Queue } from 'bullmq';
import { auditLogger } from '../middleware/audit.middleware';
import { FakeViewCampaignCreate } from '../types/fake-views.types';

export class FakeViewsController {
  private service: FakeViewsService;
  private viewQueue: Queue;

  constructor(db: Pool, viewQueue: Queue) {
    this.service = new FakeViewsService(db);
    this.viewQueue = viewQueue;
  }

  /**
   * Create a new fake views campaign
   */
  createCampaign = async (req: Request<{}, {}, FakeViewCampaignCreate>, res: Response) => {
    const userId = (req as any).user?.userId;
    
    try {
      const campaign = await this.service.createCampaign(req.body, userId);

      // Log audit
      await auditLogger.logAdminAction(
        userId || 'system',
        'FAKE_VIEWS_CAMPAIGN_CREATED',
        'fake_view_campaign',
        (campaign as any).id,
        undefined,
        {
          videoId: req.body.video_id,
          totalCount: req.body.total_count,
          duration: req.body.duration_days,
        }
      );

      res.status(201).json({
        message: 'Campaign created successfully',
        campaign,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  /**
   * Get all campaigns
   */
  getAllCampaigns = async (req: Request, res: Response) => {
    try {
      const campaigns = await this.service.getAllCampaigns();
      // Return array directly (not wrapped in object) to match frontend expectation
      res.json(campaigns || []);
    } catch (error: any) {
      console.error('Error getting all campaigns:', error);
      // Return empty array if table doesn't exist
      if (error.message?.includes('does not exist') || error.message?.includes('relation') || error.code === '42P01') {
        return res.json([]);
      }
      res.status(500).json({ message: error.message || 'Failed to fetch campaigns' });
    }
  };

  /**
   * Get campaign by ID
   */
  getCampaignById = async (req: Request, res: Response) => {
    try {
      const campaign = await this.service.getCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      res.json({ campaign });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  /**
   * Execute a campaign
   */
  executeCampaign = async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    
    try {
      const campaignId = req.params.id;
      const campaign = await this.service.getCampaignById(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      if (campaign.status !== 'pending' && campaign.status !== 'paused') {
        return res.status(400).json({ message: 'Campaign cannot be executed' });
      }

      // Update status to running
      await this.service.updateCampaignStatus(campaignId, 'running');

      // Add job to queue
      await this.viewQueue.add('process-campaign', {
        campaignId,
        videoId: campaign.video_id,
        totalCount: campaign.total_count,
        durationDays: campaign.duration_days,
        pattern: campaign.pattern,
        dailyLimit: campaign.daily_limit,
      });

      await auditLogger.logAdminAction(
        userId || 'system',
        'FAKE_VIEWS_CAMPAIGN_STARTED',
        'fake_view_campaign',
        campaignId
      );

      res.json({
        message: 'Campaign started successfully',
        campaignId,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  /**
   * Pause a campaign
   */
  pauseCampaign = async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    
    try {
      const campaignId = req.params.id;
      await this.service.pauseCampaign(campaignId);

      await auditLogger.logAdminAction(
        userId || 'system',
        'FAKE_VIEWS_CAMPAIGN_PAUSED',
        'fake_view_campaign',
        campaignId
      );

      res.json({ message: 'Campaign paused successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  /**
   * Cancel a campaign
   */
  cancelCampaign = async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    
    try {
      const campaignId = req.params.id;
      await this.service.cancelCampaign(campaignId);

      await auditLogger.logAdminAction(
        userId || 'system',
        'FAKE_VIEWS_CAMPAIGN_CANCELLED',
        'fake_view_campaign',
        campaignId
      );

      res.json({ message: 'Campaign cancelled successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  /**
   * Get campaign limits
   */
  getLimits = async (req: Request, res: Response) => {
    try {
      const limits = this.service.getLimits();
      const currentMonthly = await this.service.getCurrentMonthlyCount();
      
      res.json({
        ...limits,
        current_month_total: currentMonthly,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

