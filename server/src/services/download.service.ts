/**
 * Download Service - Handle video download requests
 */

import { Pool } from 'pg';
import { getS3Service } from './s3.service';
import { generateDecryptionToken } from './encryption.service';

interface DownloadRequest {
  videoId: string;
  userId: string;
  deviceId: string;
  quality: string;
}

interface PresignedUrlResponse {
  presignedUrl: string;
  decryptionToken: string;
  expiryDate: string;
  encryptedFileUrl: string;
}

export class DownloadService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Request presigned URL for download
   */
  async requestDownloadUrl(data: DownloadRequest): Promise<PresignedUrlResponse> {
    const { videoId, userId, deviceId, quality } = data;

    // Verify user has active subscription
    const subscriptionCheck = await this.db.query(
      `
      SELECT COUNT(*) FROM subscriptions
      WHERE user_id = $1
        AND status = 'active'
        AND end_date > CURRENT_TIMESTAMP
      `,
      [userId]
    );

    if (subscriptionCheck.rows[0].count === '0') {
      throw new Error('Active subscription required for downloads');
    }

    // Get video info
    const videoResult = await this.db.query(
      'SELECT id, title, video_url FROM videos WHERE id = $1',
      [videoId]
    );

    if (videoResult.rows.length === 0) {
      throw new Error('Video not found');
    }

    const video = videoResult.rows[0];

    // Generate presigned URL (mock for now)
    const presignedUrl = await this.generatePresignedUrl(video.video_url, quality);
    
    // Generate decryption token
    const decryptionToken = generateDecryptionToken(userId, deviceId);
    
    // Calculate expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Store download record
    await this.db.query(
      `
      INSERT INTO downloads (user_id, video_id, quality, expires_at, decryption_token, device_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, video_id, device_id) 
      DO UPDATE SET 
        expires_at = $4,
        decryption_token = $5,
        updated_at = CURRENT_TIMESTAMP
      `,
      [userId, videoId, quality, expiryDate, decryptionToken, deviceId]
    );

    return {
      presignedUrl,
      decryptionToken,
      expiryDate: expiryDate.toISOString(),
      encryptedFileUrl: presignedUrl, // In production, this would be encrypted
    };
  }

  /**
   * Generate presigned URL from S3
   */
  private async generatePresignedUrl(videoUrl: string, quality: string): Promise<string> {
    try {
      // Try to use S3 service if configured
      try {
        const s3Service = getS3Service();
        const isHealthy = await s3Service.healthCheck();
        
        if (isHealthy) {
          // Extract key from video URL or construct it
          // Video URLs in S3 should be in format: videos/{videoId}/{quality}.mp4
          const key = videoUrl.includes('s3://') || videoUrl.includes('http')
            ? this.extractS3Key(videoUrl)
            : `videos/${quality}/${videoUrl}`;
          
          // Generate presigned URL (expires in 24 hours)
          return await s3Service.getPresignedDownloadUrl(key, 86400);
        }
      } catch (s3Error) {
        console.warn('S3 not available, using mock URL:', s3Error);
      }
      
      // Fallback: Mock URL for development
      return videoUrl;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      // Fallback to original URL
      return videoUrl;
    }
  }

  /**
   * Extract S3 key from URL
   */
  private extractS3Key(url: string): string {
    // If it's an S3 URL, extract the key
    if (url.includes('s3://')) {
      const parts = url.replace('s3://', '').split('/');
      return parts.slice(1).join('/'); // Remove bucket name
    }
    
    // If it's an HTTP URL, try to extract path
    if (url.includes('http')) {
      try {
        const urlObj = new URL(url);
        return urlObj.pathname.substring(1); // Remove leading slash
      } catch {
        return url;
      }
    }
    
    return url;
  }

  /**
   * Verify download token
   */
  async verifyDownloadToken(token: string, userId: string, deviceId: string): Promise<boolean> {
    const result = await this.db.query(
      `
      SELECT COUNT(*) FROM downloads
      WHERE user_id = $1
        AND device_id = $2
        AND decryption_token = $3
        AND expires_at > CURRENT_TIMESTAMP
        AND revoked = false
      `,
      [userId, deviceId, token]
    );

    return result.rows[0].count !== '0';
  }

  /**
   * Revoke download tokens
   */
  async revokeDownloads(userId: string, deviceId?: string): Promise<void> {
    if (deviceId) {
      // Revoke specific device
      await this.db.query(
        'UPDATE downloads SET revoked = true WHERE user_id = $1 AND device_id = $2',
        [userId, deviceId]
      );
    } else {
      // Revoke all devices
      await this.db.query(
        'UPDATE downloads SET revoked = true WHERE user_id = $1',
        [userId]
      );
    }
  }
}

