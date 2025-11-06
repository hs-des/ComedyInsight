/**
 * Application Configuration
 * 
 * Centralized application configuration from environment variables
 */

import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
  corsOrigin: string | string[];
  adminUsername: string;
  adminPassword: string;
  uploadDir: string;
  subtitleBaseUrl: string;
}

/**
 * Get application configuration from environment variables
 */
export function getAppConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    corsOrigin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : '*',
    adminUsername: process.env.ADMIN_USERNAME || 'admin',
    adminPassword: process.env.ADMIN_PASSWORD || 'admin',
    uploadDir: process.env.UPLOAD_DIR || './uploads/subtitles',
    subtitleBaseUrl: process.env.SUBTITLE_BASE_URL || 'http://localhost:3000/subtitles',
  };
}

/**
 * Get Redis configuration
 * Docker: Uses internal hostname (redis:6379)
 * Local: Uses localhost:6379
 */
export function getRedisConfig(): { url: string } | { host: string; port: number } {
  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl) {
    return {
      url: redisUrl,
    };
  }

  return {
    host: process.env.REDIS_HOST || 'localhost', // Use 'redis' in Docker, 'localhost' locally
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  };
}

/**
 * Check if running in Docker
 */
export function isDocker(): boolean {
  return process.env.DOCKER === 'true' || 
         process.env.DB_HOST === 'db' || 
         process.env.REDIS_HOST === 'redis' ||
         !!process.env.DATABASE_URL?.includes('db:');
}

