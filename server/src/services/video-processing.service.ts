/**
 * Video Processing Service - Transcode videos into multiple quality versions
 */

import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';
import { getS3Service } from './s3.service';
import { Pool } from 'pg';

export interface VideoQuality {
  quality: string;
  width: number;
  height: number;
  videoBitrate: string;
  audioBitrate: string;
}

export interface ProcessingResult {
  videoId: string;
  originalQuality: string;
  qualities: {
    quality: string;
    s3Key: string;
    s3Url: string;
    fileSizeMB: number;
  }[];
}

export class VideoProcessingService {
  private db: Pool;
  private qualities: VideoQuality[] = [
    { quality: '1440p', width: 2560, height: 1440, videoBitrate: '8000k', audioBitrate: '192k' },
    { quality: '1080p', width: 1920, height: 1080, videoBitrate: '5000k', audioBitrate: '192k' },
    { quality: '720p', width: 1280, height: 720, videoBitrate: '2500k', audioBitrate: '128k' },
    { quality: '480p', width: 854, height: 480, videoBitrate: '1000k', audioBitrate: '128k' },
    { quality: '360p', width: 640, height: 360, videoBitrate: '500k', audioBitrate: '96k' },
  ];

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Get video dimensions from buffer
   */
  private async getVideoDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const stream = Readable.from(buffer);
      
      ffmpeg(stream)
        .ffprobe((err: Error | null, metadata: any) => {
          if (err) {
            reject(err);
            return;
          }

          const videoStream = metadata.streams?.find((s: any) => s.codec_type === 'video');
          if (!videoStream || !videoStream.width || !videoStream.height) {
            reject(new Error('Could not determine video dimensions'));
            return;
          }

          resolve({
            width: videoStream.width,
            height: videoStream.height,
          });
        });
    });
  }

  /**
   * Determine which qualities to generate based on source video
   */
  private async getQualitiesToGenerate(buffer: Buffer): Promise<VideoQuality[]> {
    try {
      const dimensions = await this.getVideoDimensions(buffer);
      const sourceHeight = dimensions.height;

      // Only generate qualities that are smaller than or equal to source
      return this.qualities.filter(q => q.height <= sourceHeight);
    } catch (error) {
      console.warn('Could not determine video dimensions, generating all qualities:', error);
      // Fallback: generate all qualities up to 1080p
      return this.qualities.filter(q => q.height <= 1080);
    }
  }

  /**
   * Transcode video to specific quality
   */
  private async transcodeToQuality(
    inputBuffer: Buffer,
    quality: VideoQuality
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const inputStream = Readable.from(inputBuffer);
      const outputStream = new (require('stream').PassThrough)();

      // Collect output chunks
      outputStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      outputStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      outputStream.on('error', (err: Error) => {
        reject(err);
      });

      ffmpeg(inputStream)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size(`${quality.width}x${quality.height}`)
        .videoBitrate(quality.videoBitrate)
        .audioBitrate(quality.audioBitrate)
        .format('mp4')
        .outputOptions([
          '-preset fast',
          '-movflags +faststart',
          '-pix_fmt yuv420p',
        ])
        .on('error', (err: Error) => {
          reject(err);
        })
        .on('end', () => {
          outputStream.end();
        })
        .pipe(outputStream, { end: false });
    });
  }

  /**
   * Process video and create multiple quality versions
   */
  async processVideo(
    videoId: string,
    originalBuffer: Buffer,
    originalKey: string,
    mimeType: string
  ): Promise<ProcessingResult> {
    const s3Service = getS3Service();
    const results: ProcessingResult['qualities'] = [];

    try {
      // Determine which qualities to generate
      const qualitiesToGenerate = await this.getQualitiesToGenerate(originalBuffer);
      
      console.log(`Processing video ${videoId}: Generating ${qualitiesToGenerate.length} quality versions`);

      // Process each quality
      for (const quality of qualitiesToGenerate) {
        try {
          console.log(`Transcoding to ${quality.quality}...`);
          
          // Transcode video
          const transcodedBuffer = await this.transcodeToQuality(originalBuffer, quality);
          
          // Generate S3 key
          const s3Key = `videos/${quality.quality}/${videoId}.mp4`;
          
          // Upload to S3
          await s3Service.uploadFile(s3Key, transcodedBuffer, 'video/mp4');
          
          // Generate S3 URL
          const s3Endpoint = process.env.AWS_S3_ENDPOINT;
          let s3Url: string;
          if (s3Endpoint) {
            s3Url = `${s3Endpoint}/${process.env.AWS_S3_BUCKET}/${s3Key}`;
          } else {
            s3Url = `s3://${process.env.AWS_S3_BUCKET}/${s3Key}`;
          }

          const fileSizeMB = parseFloat((transcodedBuffer.length / (1024 * 1024)).toFixed(2));

          results.push({
            quality: quality.quality,
            s3Key,
            s3Url,
            fileSizeMB,
          });

          console.log(`✓ ${quality.quality} transcoded and uploaded (${fileSizeMB}MB)`);
        } catch (error: any) {
          console.error(`Failed to transcode ${quality.quality}:`, error);
          // Continue with other qualities
        }
      }

      // Determine original quality from highest generated quality
      const originalQuality = results.length > 0 
        ? results[0].quality // Highest quality (first in array)
        : '1080p';

      // Save quality variants to database
      await this.saveQualityVariants(videoId, results);

      // Update main video record with highest quality as primary URL
      if (results.length > 0) {
        const highestQuality = results[0];
        await this.db.query(
          `UPDATE videos SET video_url = $1, quality = $2 WHERE id = $3`,
          [highestQuality.s3Url, highestQuality.quality, videoId]
        );
      }

      return {
        videoId,
        originalQuality,
        qualities: results,
      };
    } catch (error: any) {
      console.error('Video processing error:', error);
      throw new Error(`Video processing failed: ${error.message}`);
    }
  }

  /**
   * Save quality variants to database
   */
  private async saveQualityVariants(
    videoId: string,
    variants: ProcessingResult['qualities']
  ): Promise<void> {
    try {
      // Delete existing variants
      await this.db.query('DELETE FROM video_variants WHERE video_id = $1', [videoId]);

      // Insert new variants
      for (const variant of variants) {
        await this.db.query(
          `INSERT INTO video_variants (video_id, quality, video_url, file_size_mb, mime_type, is_active)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (video_id, quality) DO UPDATE SET
             video_url = EXCLUDED.video_url,
             file_size_mb = EXCLUDED.file_size_mb,
             updated_at = CURRENT_TIMESTAMP`,
          [videoId, variant.quality, variant.s3Url, variant.fileSizeMB, 'video/mp4', true]
        );
      }

      console.log(`Saved ${variants.length} quality variants to database`);
    } catch (error: any) {
      console.error('Failed to save quality variants:', error);
      // Don't throw - variants are uploaded, DB save can be retried
    }
  }

  /**
   * Get duration of video
   */
  async getVideoDuration(buffer: Buffer): Promise<number> {
    return new Promise((resolve, reject) => {
      const stream = Readable.from(buffer);
      
      ffmpeg(stream)
        .ffprobe((err: Error | null, metadata: any) => {
          if (err) {
            reject(err);
            return;
          }

          const videoStream = metadata.streams?.find((s: any) => s.codec_type === 'video');
          if (!videoStream || !videoStream.duration) {
            reject(new Error('Could not determine video duration'));
            return;
          }

          resolve(Math.floor(videoStream.duration));
        });
    });
  }
}
