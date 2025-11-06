/**
 * View Distribution Worker - Processes fake view campaigns
 */

import { Worker, Job } from 'bullmq';
import { Pool } from 'pg';
import { FakeViewsRepository } from '../repositories/fake-views.repository';

interface CampaignJobData {
  campaignId: string;
  videoId: string;
  totalCount: number;
  durationDays: number;
  pattern: 'burst' | 'steady';
  dailyLimit: number;
}

export class ViewDistributionWorker {
  private worker: Worker;
  private repository: FakeViewsRepository;
  private db: Pool;

  constructor(connection: any, db: Pool) {
    this.db = db;
    this.repository = new FakeViewsRepository(db);

    this.worker = new Worker<CampaignJobData>(
      'process-campaign',
      async (job: Job<CampaignJobData>) => {
        await this.processCampaign(job);
      },
      {
        connection,
        concurrency: 1, // Process one campaign at a time
      }
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.worker.on('completed', (job) => {
      console.log(`Campaign ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Campaign ${job?.id} failed:`, err);
    });
  }

  private async processCampaign(job: Job<CampaignJobData>) {
    const { campaignId, videoId, totalCount, durationDays, pattern, dailyLimit } = job.data;

    console.log(`Processing campaign ${campaignId} for video ${videoId}`);

    // Check if campaign is still active
    const campaign = await this.repository.findById(campaignId);
    if (!campaign || campaign.status !== 'running') {
      throw new Error('Campaign is not running');
    }

    // Calculate views to add per batch
    const batchSize = 1000;
    const totalBatches = Math.ceil(totalCount / batchSize);

    for (let batch = 0; batch < totalBatches; batch++) {
      // Check cancellation again before each batch
      const currentCampaign = await this.repository.findById(campaignId);
      if (!currentCampaign || currentCampaign.status !== 'running') {
        console.log(`Campaign ${campaignId} was cancelled/paused`);
        break;
      }

      const viewsInBatch = Math.min(batchSize, totalCount - batch * batchSize);
      
      // Add views to video
      await this.repository.addViewToVideo(videoId, viewsInBatch);
      
      // Update campaign progress
      await this.repository.incrementExecutedCount(campaignId, viewsInBatch);

      // Update job progress
      await job.updateProgress((batch + 1) / totalBatches);

      console.log(`Batch ${batch + 1}/${totalBatches}: Added ${viewsInBatch} views`);

      // Small delay between batches
      await this.sleep(1000);
    }

    // Mark campaign as completed
    await this.repository.updateStatus(campaignId, 'completed', new Date());

    console.log(`Campaign ${campaignId} completed successfully`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async close() {
    await this.worker.close();
  }
}

