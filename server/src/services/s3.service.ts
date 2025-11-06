/**
 * S3 Service - AWS S3 and MinIO client for file storage
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface S3Config {
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  usePathStyle?: boolean;
}

export class S3Service {
  private client: S3Client;
  private bucket: string;

  constructor(config?: S3Config) {
    const s3Config: S3Config = config || {
      endpoint: process.env.AWS_S3_ENDPOINT || undefined,
      region: process.env.AWS_S3_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      bucket: process.env.AWS_S3_BUCKET || 'comedyinsight-videos',
      usePathStyle: process.env.AWS_S3_USE_PATH_STYLE === 'true',
    };

    this.bucket = s3Config.bucket;

    // Create S3 client (works with AWS S3 and MinIO)
    this.client = new S3Client({
      region: s3Config.region,
      endpoint: s3Config.endpoint,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
      forcePathStyle: s3Config.usePathStyle || false,
    });
  }

  /**
   * Generate presigned URL for downloading a file
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600 // 1 hour default
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  /**
   * Generate presigned URL for uploading a file
   */
  async getPresignedUploadUrl(
    key: string,
    contentType?: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('Error generating presigned upload URL:', error);
      throw new Error('Failed to generate presigned upload URL');
    }
  }

  /**
   * Upload file buffer to S3
   */
  async uploadFile(
    key: string,
    body: Buffer,
    contentType?: string
  ): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Check if S3 is configured and accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to generate a test presigned URL
      await this.getPresignedDownloadUrl('test', 60);
      return true;
    } catch (error) {
      console.warn('S3 health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
let s3ServiceInstance: S3Service | null = null;

export const getS3Service = (): S3Service => {
  if (!s3ServiceInstance) {
    // Check if S3 is configured
    const hasConfig =
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_S3_BUCKET;

    if (!hasConfig && process.env.NODE_ENV === 'production') {
      throw new Error(
        'S3 configuration missing. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET'
      );
    }

    // In development, create service even without config (will fail gracefully)
    s3ServiceInstance = new S3Service();
  }
  return s3ServiceInstance;
};
