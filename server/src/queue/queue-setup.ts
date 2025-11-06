/**
 * Queue Setup - BullMQ configuration
 * 
 * Uses centralized Redis configuration that supports Docker internal hostnames
 */

import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { getRedisConfig } from '../config/app.config';

let redisConnection: Redis | null = null;
let viewQueue: Queue | null = null;

export function getRedisConnection(): Redis {
  if (!redisConnection) {
    const redisConfig = getRedisConfig();
    
    // Support both URL and host/port configuration
    if ('url' in redisConfig) {
      redisConnection = new Redis(redisConfig.url, {
        maxRetriesPerRequest: null, // Required by BullMQ for blocking commands
      });
    } else {
      redisConnection = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        maxRetriesPerRequest: null, // Required by BullMQ for blocking commands
      });
    }
  }
  return redisConnection;
}

export function getViewQueue(): Queue {
  if (!viewQueue) {
    const connection = getRedisConnection();
    viewQueue = new Queue('process-campaign', {
      connection,
    });
  }
  return viewQueue;
}

export async function closeQueues() {
  if (viewQueue) {
    await viewQueue.close();
    viewQueue = null;
  }
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
  }
}

