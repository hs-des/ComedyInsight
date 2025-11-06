/**
 * Videos Routes - Video management endpoints
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.middleware';
import { getS3Service } from '../services/s3.service';
import { getViewQueue } from '../queue/queue-setup';
import { v4 as uuidv4 } from 'uuid';

export const createVideosRoutes = (db: Pool): Router => {
  const router = Router();

  // Configure multer for file uploads (store in memory)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024 * 1024, // 5GB max file size
    },
    fileFilter: (req, file, cb) => {
      // Accept video files
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed'));
      }
    },
  });

  /**
   * GET /api/videos
   * Get all videos (admin)
   */
  router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('Fetching videos from database...');
      
      const result = await db.query(`
        SELECT 
          v.id,
          v.title,
          v.video_url,
          v.thumbnail_url as thumbnail,
          v.duration_seconds as duration,
          v.is_active,
          v.created_at,
          COALESCE(v.visible_view_count, v.real_view_count, 0) as views,
          COALESCE(a.name, 'Unknown') as artist_name
        FROM videos v
        LEFT JOIN video_artists va ON v.id = va.video_id AND va.role = 'main'
        LEFT JOIN artists a ON va.artist_id = a.id
        WHERE v.deleted_at IS NULL
        GROUP BY v.id, v.title, v.video_url, v.thumbnail_url, v.duration_seconds, v.is_active, v.created_at, v.visible_view_count, v.real_view_count, a.name
        ORDER BY v.created_at DESC
        LIMIT 100
      `);

      console.log(`Found ${result.rows.length} videos in database`);

      const videos = result.rows.map(row => ({
        id: row.id,
        title: row.title || 'Untitled',
        artist: row.artist_name || 'Unknown',
        views: parseInt(row.views || '0', 10),
        duration: parseInt(row.duration || '0', 10),
        status: row.is_active ? 'published' : 'draft',
        thumbnail: row.thumbnail || '',
        video_url: row.video_url,
      }));

      console.log(`Returning ${videos.length} videos to client`);
      res.status(200).json(videos);
    } catch (error: any) {
      console.error('Videos list error:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        hint: error?.hint,
        stack: error?.stack,
      });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch videos',
        details: error?.message,
      });
    }
  });

  /**
   * POST /api/videos
   * Upload a new video
   */
  router.post(
    '/',
    authenticateToken,
    upload.single('video'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        if (!req.file) {
          res.status(400).json({
            error: 'Bad Request',
            message: 'Video file is required',
          });
          return;
        }

        const { title, description, artist, videoType, isPremium, tags } = req.body;
        // Note: quality is now automated - will be determined during processing
        const file = req.file;
        const userId = (req as any).user?.userId || 'admin';

        // Generate unique video ID and file key
        const videoId = uuidv4();
        const fileExtension = file.originalname.split('.').pop() || 'mp4';
        const s3Key = `videos/${videoId}.${fileExtension}`;

        // Upload to S3
        let videoUrl: string;
        try {
          const s3Service = getS3Service();
          const isHealthy = await s3Service.healthCheck();

          if (isHealthy) {
            // Upload file to S3
            await s3Service.uploadFile(s3Key, file.buffer, file.mimetype);
            
            // Generate S3 URL (use endpoint if MinIO, otherwise use bucket URL)
            const s3Endpoint = process.env.AWS_S3_ENDPOINT;
            if (s3Endpoint) {
              // MinIO - use endpoint URL
              videoUrl = `${s3Endpoint}/${process.env.AWS_S3_BUCKET}/${s3Key}`;
            } else {
              // AWS S3 - use standard URL
              videoUrl = `s3://${process.env.AWS_S3_BUCKET}/${s3Key}`;
            }
          } else {
            // Fallback: save URL reference (file not uploaded)
            videoUrl = `local://uploads/${s3Key}`;
            console.warn('S3 not available, saving URL reference only');
          }
        } catch (s3Error: any) {
          console.error('S3 upload error:', s3Error);
          res.status(500).json({
            error: 'Upload Failed',
            message: 'Failed to upload video to storage',
          });
          return;
        }

        // Generate slug from title
        const slug = (title || 'untitled')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') + '-' + videoId.substring(0, 8);

        // Calculate file size in MB
        const fileSizeMB = parseFloat((file.size / (1024 * 1024)).toFixed(2));

        // Save to database (quality will be updated after processing)
        try {
          const result = await db.query(
            `
            INSERT INTO videos (
              id, title, slug, description, video_url, 
              duration_seconds, video_type, quality, file_size_mb, mime_type,
              is_premium, is_active, tags, metadata, published_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING id, title, slug, video_url, created_at
            `,
            [
              videoId,
              title || 'Untitled Video',
              slug,
              description || null,
              videoUrl, // Temporary URL, will be updated after processing
              null, // duration_seconds - will be calculated during processing
              videoType || 'full',
              'auto', // Quality will be determined automatically during processing
              fileSizeMB,
              file.mimetype,
              isPremium === 'true' || isPremium === true,
              false, // Start as draft (not active)
              tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : [],
              JSON.stringify({ 
                uploaded_by: userId, 
                original_filename: file.originalname,
                processing_status: 'queued'
              }),
              null, // published_at - will be set when published
            ]
          );

          // Queue video processing job
          try {
            const viewQueue = getViewQueue();
            // Note: Buffer needs to be serialized for Redis queue
            // Store buffer in a temporary location or pass via different method
            // For now, we'll store the original file in S3 and process it from there
            await viewQueue.add(
              'process-video',
              {
                videoId,
                originalBuffer: file.buffer.toString('base64'), // Serialize buffer as base64
                originalKey: s3Key,
                mimeType: file.mimetype,
              },
              {
                attempts: 3,
                backoff: {
                  type: 'exponential',
                  delay: 5000,
                },
                jobId: `video-${videoId}`, // Unique job ID
              }
            );
            console.log(`Video processing job queued for video ${videoId}`);
          } catch (queueError: any) {
            console.error('Failed to queue video processing:', queueError);
            // Don't fail the upload - processing can be retried later
          }

          // Link artist if provided (assuming artist name, will need artist ID lookup)
          if (artist) {
            try {
              const artistResult = await db.query(
                'SELECT id FROM artists WHERE name = $1 OR slug = $1 LIMIT 1',
                [artist]
              );

              if (artistResult.rows.length > 0) {
                const artistId = artistResult.rows[0].id;
                await db.query(
                  'INSERT INTO video_artists (video_id, artist_id, role) VALUES ($1, $2, $3)',
                  [videoId, artistId, 'main']
                );
              }
            } catch (artistError) {
              console.warn('Could not link artist:', artistError);
            }
          }

          res.status(201).json({
            message: 'Video uploaded successfully',
            video: result.rows[0],
          });
        } catch (dbError: any) {
          console.error('Database error:', dbError);
          
          // If database insert fails, we should ideally delete from S3
          // For now, just return error
          res.status(500).json({
            error: 'Database Error',
            message: 'Video uploaded to storage but failed to save metadata',
          });
        }
      } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: error.message || 'Failed to upload video',
        });
      }
    }
  );

  /**
   * PUT /api/videos/:id
   * Update a video
   */
  router.put('/:id', authenticateToken, upload.fields([{ name: 'thumbnail', maxCount: 1 }]), async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const {
        title,
        description,
        rating,
        trailer_url,
        videoType,
        language,
        isPremium,
        isFeatured,
        isActive,
        tags,
        publishedAt,
      } = req.body;

      // Parse array fields (if sent as strings)
      const artistIds = Array.isArray(req.body['artistIds[]']) 
        ? req.body['artistIds[]'] 
        : req.body['artistIds[]'] 
          ? [req.body['artistIds[]']] 
          : [];
      
      const categoryIds = Array.isArray(req.body['categoryIds[]']) 
        ? req.body['categoryIds[]'] 
        : req.body['categoryIds[]'] 
          ? [req.body['categoryIds[]']] 
          : [];

      console.log(`Updating video with id: ${id}`);

      // Check if video exists
      const videoCheck = await db.query('SELECT id, metadata FROM videos WHERE id = $1 AND deleted_at IS NULL', [id]);
      if (videoCheck.rows.length === 0) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Video not found',
        });
        return;
      }

      const existingMetadata = videoCheck.rows[0].metadata || {};

      // Handle thumbnail upload if provided
      let thumbnailUrl: string | null = null;
      if (files?.thumbnail && files.thumbnail[0]) {
        const thumbnailFile = files.thumbnail[0];
        const s3Key = `thumbnails/${id}/${Date.now()}-${thumbnailFile.originalname}`;
        
        try {
          const s3Service = getS3Service();
          const isHealthy = await s3Service.healthCheck();

          if (isHealthy) {
            await s3Service.uploadFile(s3Key, thumbnailFile.buffer, thumbnailFile.mimetype);
            const s3Endpoint = process.env.AWS_S3_ENDPOINT;
            thumbnailUrl = s3Endpoint 
              ? `${s3Endpoint}/${process.env.AWS_S3_BUCKET}/${s3Key}`
              : `s3://${process.env.AWS_S3_BUCKET}/${s3Key}`;
          } else {
            thumbnailUrl = `local://uploads/${s3Key}`;
            console.warn('S3 not available, saving URL reference only');
          }
        } catch (s3Error: any) {
          console.error('Thumbnail upload error:', s3Error);
          // Continue without updating thumbnail
        }
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updateFields.push(`title = $${paramIndex++}`);
        updateValues.push(title);
        
        // Update slug if title changed
        if (title) {
          const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + id.substring(0, 8);
          updateFields.push(`slug = $${paramIndex++}`);
          updateValues.push(slug);
        }
      }

      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        updateValues.push(description || null);
      }

      if (thumbnailUrl !== null) {
        updateFields.push(`thumbnail_url = $${paramIndex++}`);
        updateValues.push(thumbnailUrl);
      }

      if (videoType !== undefined) {
        updateFields.push(`video_type = $${paramIndex++}`);
        updateValues.push(videoType);
      }

      if (language !== undefined) {
        updateFields.push(`language = $${paramIndex++}`);
        updateValues.push(language);
      }

      if (isPremium !== undefined) {
        updateFields.push(`is_premium = $${paramIndex++}`);
        updateValues.push(isPremium === 'true' || isPremium === true);
      }

      if (isFeatured !== undefined) {
        updateFields.push(`is_featured = $${paramIndex++}`);
        updateValues.push(isFeatured === 'true' || isFeatured === true);
      }

      if (isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        updateValues.push(isActive === 'true' || isActive === true);
      }

      if (tags !== undefined) {
        const tagsArray = tags 
          ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim()))
          : [];
        updateFields.push(`tags = $${paramIndex++}`);
        updateValues.push(tagsArray);
      }

      if (publishedAt !== undefined) {
        updateFields.push(`published_at = $${paramIndex++}`);
        updateValues.push(publishedAt ? new Date(publishedAt) : null);
      }

      // Update metadata (rating, trailer_url)
      const newMetadata = { ...existingMetadata };
      if (rating !== undefined && rating !== '') {
        newMetadata.rating = parseFloat(rating);
      }
      if (trailer_url !== undefined) {
        newMetadata.trailer_url = trailer_url || null;
      }

      if (rating !== undefined || trailer_url !== undefined) {
        updateFields.push(`metadata = $${paramIndex++}`);
        updateValues.push(JSON.stringify(newMetadata));
      }

      // Always update updated_at
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      // Execute update
      if (updateFields.length > 0) {
        updateValues.push(id);
        const updateQuery = `UPDATE videos SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id`;
        await db.query(updateQuery, updateValues);
      }

      // Update artist relationships
      if (artistIds.length >= 0) { // Allow empty array to remove all artists
        // Delete existing relationships
        await db.query('DELETE FROM video_artists WHERE video_id = $1', [id]);
        
        // Insert new relationships
        if (artistIds.length > 0) {
          for (let i = 0; i < artistIds.length; i++) {
            const artistId = artistIds[i];
            // Check if artist exists
            const artistCheck = await db.query('SELECT id FROM artists WHERE id = $1', [artistId]);
            if (artistCheck.rows.length > 0) {
              await db.query(
                'INSERT INTO video_artists (video_id, artist_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                [id, artistId, i === 0 ? 'main' : 'featured']
              );
            }
          }
        }
      }

      // Update category relationships
      if (categoryIds.length >= 0) { // Allow empty array to remove all categories
        // Delete existing relationships
        await db.query('DELETE FROM video_categories WHERE video_id = $1', [id]);
        
        // Insert new relationships
        if (categoryIds.length > 0) {
          for (const categoryId of categoryIds) {
            // Check if category exists
            const categoryCheck = await db.query('SELECT id FROM categories WHERE id = $1', [categoryId]);
            if (categoryCheck.rows.length > 0) {
              await db.query(
                'INSERT INTO video_categories (video_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [id, categoryId]
              );
            }
          }
        }
      }

      console.log(`Video ${id} updated successfully`);
      res.status(200).json({ message: 'Video updated successfully' });
    } catch (error: any) {
      console.error('Update video error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update video',
        details: error?.message,
      });
    }
  });

  /**
   * DELETE /api/videos/:id
   * Delete a video (soft delete - sets deleted_at timestamp)
   */
  router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      console.log(`Deleting video with id: ${id}`);

      // Soft delete: set deleted_at timestamp instead of hard delete
      const result = await db.query(
        'UPDATE videos SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id',
        [id]
      );
      
      if (result.rows.length === 0) {
        // Check if video exists but is already deleted
        const checkResult = await db.query('SELECT id FROM videos WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
          res.status(404).json({
            error: 'Not Found',
            message: 'Video not found',
          });
          return;
        } else {
          res.status(200).json({ message: 'Video already deleted' });
          return;
        }
      }

      console.log(`Video ${id} soft deleted successfully`);
      res.status(200).json({ message: 'Video deleted successfully' });
    } catch (error: any) {
      console.error('Delete video error:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        hint: error?.hint,
      });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete video',
        details: error?.message,
      });
    }
  });

  return router;
};
