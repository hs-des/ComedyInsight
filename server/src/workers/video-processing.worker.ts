/**
 * Video Processing Worker - Processes video transcoding jobs
 */

import { Worker, Job } from 'bullmq';
import { Pool } from 'pg';
import { VideoProcessingService } from '../services/video-processing.service';

interface VideoProcessingJobData {
  videoId: string;
  originalBuffer: string; // Base64 encoded buffer
  originalKey: string;
  mimeType: string;
}

export class VideoProcessingWorker {
  private worker: Worker;
  private processingService: VideoProcessingService;
  private db: Pool;

  constructor(connection: any, db: Pool) {
    this.db = db;
    this.processingService = new VideoProcessingService(db);

    this.worker = new Worker<VideoProcessingJobData>(
      'process-video',
      async (job: Job<VideoProcessingJobData>) => {
        await this.processVideo(job);
      },
      {
        connection,
        concurrency: 2, // Process 2 videos concurrently (adjust based on server capacity)
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      }
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.worker.on('completed', (job) => {
      console.log(`✓ Video processing job ${job.id} completed for video ${job.data.videoId}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`✗ Video processing job ${job?.id} failed for video ${job?.data.videoId}:`, err);
      
      // Update video status to failed
      if (job?.data.videoId) {
        this.db.query(
          `UPDATE videos SET metadata = jsonb_set(metadata, '{processing_status}', '"failed"') WHERE id = $1`,
          [job.data.videoId]
        ).catch(err => console.error('Failed to update video status:', err));
      }
    });

    this.worker.on('error', (err) => {
      console.error('Video processing worker error:', err);
    });
  }

  private async processVideo(job: Job<VideoProcessingJobData>) {
    const { videoId, originalBuffer, originalKey, mimeType } = job.data;

    // Deserialize buffer from base64
    const buffer = Buffer.from(originalBuffer, 'base64');

    try {
      // Update status to processing
      await this.db.query(
        `UPDATE videos SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{processing_status}', '"processing"') WHERE id = $1`,
        [videoId]
      );

      // Update progress
      job.updateProgress(10);

      // Get video duration
      let duration: number | null = null;
      try {
        duration = await this.processingService.getVideoDuration(buffer);
        await this.db.query(
          `UPDATE videos SET duration_seconds = $1 WHERE id = $2`,
          [duration, videoId]
        );
        job.updateProgress(20);
      } catch (error) {
        console.warn(`Could not get video duration for ${videoId}:`, error);
      }

      // Process video and create quality versions
      const result = await this.processingService.processVideo(
        videoId,
        buffer,
        originalKey,
        mimeType
      );

      job.updateProgress(90);

      // Update video status to completed
      await this.db.query(
        `UPDATE videos SET 
          metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{processing_status}', '"completed"'),
          metadata = jsonb_set(metadata, '{processed_qualities}', $1)
         WHERE id = $2`,
        [JSON.stringify(result.qualities.map(q => q.quality)), videoId]
      );

      job.updateProgress(100);

      console.log(`Video ${videoId} processed successfully: ${result.qualities.length} quality versions created`);
    } catch (error: any) {
      console.error(`Error processing video ${videoId}:`, error);
      
      // Update status to failed
      await this.db.query(
        `UPDATE videos SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{processing_status}', '"failed"') WHERE id = $1`,
        [videoId]
      );

      throw error;
    }
  }

  async close() {
    await this.worker.close();
  }
}
