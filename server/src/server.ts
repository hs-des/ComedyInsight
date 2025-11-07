import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { createAuthRoutes } from './routes/auth.routes';
import { createSubtitleRoutes } from './routes/subtitle.routes';
import { createFakeViewsRoutes } from './routes/fake-views.routes';
import { createSubscriptionRoutes } from './routes/subscription.routes';
import { createAdsRoutes } from './routes/ads.routes';
import { createDownloadsRoutes } from './routes/downloads.routes';
import { createAdminRoutes } from './routes/admin.routes';
import { createVideosRoutes } from './routes/videos.routes';
import { normalizeErrors } from './middleware/validation.middleware';
import { ViewDistributionWorker } from './workers/view-distribution.worker';
import { VideoProcessingWorker } from './workers/video-processing.worker';
import { getRedisConnection, closeQueues } from './queue/queue-setup';
import { createDatabasePool, testDatabaseConnection } from './config/database.config';
import { getAppConfig, getRedisConfig, isDocker } from './config/app.config';
import { errorHandler, notFoundHandler, createSuccessResponse } from './utils/error-handler';

// Load environment variables
dotenv.config();

const app = express();
const config = getAppConfig();

// Initialize PostgreSQL connection pool using centralized config
const pool = createDatabasePool();

// Make pool available globally for services (for backward compatibility)
(global as any).dbPool = pool;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
})); // Enable CORS with config
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev')); // HTTP request logger
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded bodies

// API Routes
const authRoutes = createAuthRoutes(pool);
app.use('/auth', authRoutes);

const subtitleRoutes = createSubtitleRoutes(pool);
app.use('', subtitleRoutes);

const fakeViewsRoutes = createFakeViewsRoutes(pool);
app.use('/api', fakeViewsRoutes);

const subscriptionRoutes = createSubscriptionRoutes(pool);
app.use('/api', subscriptionRoutes);

const adsRoutes = createAdsRoutes(pool);
app.use('/api', adsRoutes);

const downloadsRoutes = createDownloadsRoutes(pool);
app.use('/api', downloadsRoutes);

const adminRoutes = createAdminRoutes(pool);
app.use('/api/admin', adminRoutes);

const videosRoutes = createVideosRoutes(pool);
app.use('/api/videos', videosRoutes);

// Serve subtitle files
app.use('/subtitles', express.static(path.resolve(config.uploadDir)));

// Initialize workers
const redisConnection = getRedisConnection();
const viewWorker = new ViewDistributionWorker(redisConnection, pool);
const videoWorker = new VideoProcessingWorker(redisConnection, pool);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    const dbHealthy = await testDatabaseConnection(pool);
    
    // Test Redis connection
    let redisHealthy = false;
    try {
      const redis = getRedisConnection();
      await redis.ping();
      redisHealthy = true;
    } catch (redisError) {
      console.warn('Redis connection check failed:', redisError);
    }
    
    const status = dbHealthy && redisHealthy ? 'healthy' : 'degraded';
    const statusCode = dbHealthy ? 200 : 503;
    
    res.status(statusCode).json({
      status,
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      docker: isDocker(),
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
        redis: redisHealthy ? 'connected' : 'disconnected',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API routes placeholder
app.get('/api', (req: Request, res: Response) => {
  res.json(createSuccessResponse({
    message: 'ComedyInsight API',
    version: '1.0.0',
    environment: config.nodeEnv,
    docker: isDocker(),
  }));
});

// Error handling middleware (must be after all routes)
app.use(errorHandler);

// 404 handler (must be last)
app.use(notFoundHandler);

// Start server
app.listen(config.port, '0.0.0.0', () => {
  const redisConfig = getRedisConfig();
  const redisLabel = '🔴 Redis:';
  const redisInfo = 'url' in redisConfig ? redisConfig.url : `${redisConfig.host}:${redisConfig.port}`;

  console.log(`🚀 Server running on http://0.0.0.0:${config.port}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🐳 Docker: ${isDocker() ? 'Yes' : 'No'}`);
  console.log(`📦 Database: ${process.env.DATABASE_URL ? 'Using DATABASE_URL' : 'Using individual DB_* vars'}`);
  console.log(`${redisLabel} ${redisInfo}`);
});

// Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing server');
    await viewWorker.close();
    await videoWorker.close();
    await closeQueues();
    await pool.end();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing server');
    await viewWorker.close();
    await videoWorker.close();
    await closeQueues();
    await pool.end();
    process.exit(0);
  });

