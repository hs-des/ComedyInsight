/**
 * Video Controller - Request handlers for video operations
 */

import { Request, Response } from 'express';
import { Pool } from 'pg';
import { VideoService } from '../services/video.service';
import { getS3Service } from '../services/s3.service';
import { auditLogger } from '../middleware/audit.middleware';

export class VideoController {
  private service: VideoService;

  constructor(db: Pool) {
    this.service = new VideoService(db);
  }

  /**
   * POST /api/videos/upload
   * Upload video file
   */
  uploadVideo = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId || 'system';
      const videoFile = req.file;

      if (!videoFile) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Video file is required',
        });
        return;
      }

      const {
        title,
        description,
        video_type = 'full',
        quality = '720p',
        language = 'en',
        is_featured = 'false',
        is_premium = 'false',
        artist,
        tags,
      } = req.body;

      if (!title) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Title is required',
        });
        return;
      }

      // Handle thumbnail upload if provided
      let thumbnailUrl: string | undefined;
      if (req.body.thumbnail_url) {
        thumbnailUrl = req.body.thumbnail_url;
      }

      // Upload video and create record
      const video = await this.service.uploadVideo(
        videoFile.buffer,
        videoFile.originalname,
        videoFile.mimetype,
        {
          title,
          description,
          thumbnail_url: thumbnailUrl,
          video_type,
          quality,
          language,
          is_featured: is_featured === 'true',
          is_premium: is_premium === 'true',
          tags: tags ? tags.split(',').map((t: string) => t.trim()) : undefined,
          artist,
        }
      );

      // Log audit
      await auditLogger.logAdminAction(
        userId,
        'VIDEO_UPLOADED',
        'video',
        video.id,
        undefined,
        { title, quality, video_type }
      );

      res.status(201).json({
        message: 'Video uploaded successfully',
        video: {
          id: video.id,
          title: video.title,
          slug: video.slug,
          video_url: video.video_url,
          thumbnail_url: video.thumbnail_url,
          quality: video.quality,
          video_type: video.video_type,
          created_at: video.created_at,
        },
      });
    } catch (error: any) {
      console.error('Video upload error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to upload video',
      });
    }
  };

  /**
   * GET /api/videos
   * Get all videos
   */
  getAllVideos = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const videos = await this.service.getAllVideos(limit, offset);

      res.status(200).json(videos);
    } catch (error: any) {
      console.error('Get videos error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch videos',
      });
    }
  };

  /**
   * GET /api/videos/:id
   * Get video by ID
   */
  getVideoById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const video = await this.service.getVideoById(id);

      if (!video) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Video not found',
        });
        return;
      }

      res.status(200).json(video);
    } catch (error: any) {
      console.error('Get video error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch video',
      });
    }
  };

  /**
   * DELETE /api/videos/:id
   * Delete video
   */
  deleteVideo = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId || 'system';
      const { id } = req.params;

      const deleted = await this.service.deleteVideo(id);

      if (!deleted) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Video not found',
        });
        return;
      }

      // Log audit
      await auditLogger.logAdminAction(
        userId,
        'VIDEO_DELETED',
        'video',
        id
      );

      res.status(200).json({ message: 'Video deleted successfully' });
    } catch (error: any) {
      console.error('Delete video error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete video',
      });
    }
  };
}
