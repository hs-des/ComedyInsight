/**
 * Video Service - Business logic for video operations
 */

import { Pool } from 'pg';
import { VideoRepository, VideoCreate } from '../repositories/video.repository';
import { getS3Service } from './s3.service';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export class VideoService {
  private repository: VideoRepository;
  private s3Service: ReturnType<typeof getS3Service>;

  constructor(db: Pool) {
    this.repository = new VideoRepository(db);
    try {
      this.s3Service = getS3Service();
    } catch (error) {
      console.warn('S3 service not available:', error);
      this.s3Service = null as any;
    }
  }

  /**
   * Upload video file to S3 and create video record
   */
  async uploadVideo(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    videoData: Omit<VideoCreate, 'video_url' | 'mime_type' | 'file_size_mb'>
  ): Promise<any> {
    try {
      // Generate unique file key for S3
      const fileId = uuidv4();
      const ext = path.extname(filename).toLowerCase();
      const s3Key = `videos/${videoData.quality || '720p'}/${fileId}${ext}`;

      // Calculate file size in MB
      const fileSizeMB = fileBuffer.length / (1024 * 1024);

      // Upload to S3
      let videoUrl: string;
      try {
        if (this.s3Service) {
          const isHealthy = await this.s3Service.healthCheck();
          if (isHealthy) {
            await this.s3Service.uploadFile(s3Key, fileBuffer, mimeType);
            // Generate presigned URL for the uploaded video
            videoUrl = await this.s3Service.getPresignedDownloadUrl(s3Key, 86400 * 365); // 1 year
          } else {
            throw new Error('S3 not healthy');
          }
        } else {
          throw new Error('S3 service not available');
        }
      } catch (s3Error) {
        console.warn('S3 upload failed, using fallback:', s3Error);
        // Fallback: Store as base64 or use a local path
        videoUrl = `s3://${s3Key}`; // Store S3 path for later
      }

      // Create video record in database
      const video = await this.repository.create({
        ...videoData,
        video_url: videoUrl,
        mime_type: mimeType,
        file_size_mb: fileSizeMB,
      });

      return video;
    } catch (error: any) {
      console.error('Error uploading video:', error);
      throw new Error(`Failed to upload video: ${error.message}`);
    }
  }

  /**
   * Create video (without file upload)
   */
  async createVideo(data: VideoCreate): Promise<any> {
    return this.repository.create(data);
  }

  /**
   * Get video by ID
   */
  async getVideoById(id: string): Promise<any | null> {
    return this.repository.findById(id);
  }

  /**
   * Get all videos
   */
  async getAllVideos(limit?: number, offset?: number): Promise<any[]> {
    return this.repository.findAll(limit, offset);
  }

  /**
   * Update video
   */
  async updateVideo(id: string, updates: Partial<VideoCreate>): Promise<any | null> {
    return this.repository.update(id, updates);
  }

  /**
   * Delete video
   */
  async deleteVideo(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
