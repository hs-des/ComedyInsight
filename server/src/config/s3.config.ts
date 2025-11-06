/**
 * S3/MinIO Configuration
 * 
 * Centralized S3/MinIO configuration that supports both
 * Docker internal hostnames and external URLs
 */

import dotenv from 'dotenv';

dotenv.config();

export interface S3Config {
  endpoint: string | undefined; // MinIO endpoint (e.g., http://minio:9000 for Docker)
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  usePathStyle: boolean; // Required for MinIO
  port?: number; // MinIO port (default 9000)
}

/**
 * Get S3/MinIO configuration from environment variables
 * 
 * Docker: Uses internal hostnames (minio:9000)
 * Local: Uses localhost:9000
 * Production: Uses AWS S3 (no endpoint)
 */
export function getS3Config(): S3Config {
  const endpoint = process.env.AWS_S3_ENDPOINT;
  const port = process.env.MINIO_PORT 
    ? parseInt(process.env.MINIO_PORT, 10) 
    : endpoint?.includes('minio') ? 9000 : undefined;

  return {
    endpoint: endpoint || undefined, // Empty for AWS S3, set for MinIO
    region: process.env.AWS_S3_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.MINIO_ROOT_USER || 'minioadmin',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
    bucket: process.env.AWS_S3_BUCKET || 'comedyinsight-videos',
    usePathStyle: process.env.AWS_S3_USE_PATH_STYLE === 'true' || !!endpoint, // Always true for MinIO
    port,
  };
}

/**
 * Get MinIO console URL (for admin access)
 * Docker: http://minio:9001
 * Local: http://localhost:9001
 */
export function getMinIOConsoleUrl(): string {
  const endpoint = process.env.AWS_S3_ENDPOINT;
  if (endpoint && endpoint.includes('minio')) {
    // Extract host from endpoint (e.g., http://minio:9000 -> minio)
    const host = endpoint.replace(/^https?:\/\//, '').split(':')[0];
    return `http://${host}:9001`;
  }
  return 'http://localhost:9001';
}

/**
 * Get public S3 URL for a file
 * Used for generating public URLs to video files
 */
export function getS3PublicUrl(key: string, config?: S3Config): string {
  const s3Config = config || getS3Config();
  
  if (s3Config.endpoint) {
    // MinIO: Use endpoint URL
    const baseUrl = s3Config.endpoint.replace(/:\d+$/, ''); // Remove port if present
    return `${baseUrl}/${s3Config.bucket}/${key}`;
  }
  
  // AWS S3: Use standard S3 URL
  return `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
}

