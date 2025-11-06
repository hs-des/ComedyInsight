/**
 * Subtitle Controller - Handle subtitle endpoints
 */

import { Request, Response } from 'express';
import { Pool } from 'pg';
import { SubtitleService } from '../services/subtitle.service';
import {
  SubtitleResponse,
  SubtitleError,
  SubtitleNotFoundError,
} from '../types/subtitle.types';
import { auditLogger } from '../middleware/audit.middleware';

export class SubtitleController {
  private service: SubtitleService;

  constructor(db: Pool) {
    this.service = new SubtitleService(db);
  }

  /**
   * POST /admin/videos/:videoId/subtitles
   * Upload subtitle file
   */
  uploadSubtitle = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Subtitle file is required',
        });
        return;
      }

      const { video_id } = req.params;
      const { language, label, format, sync_offset } = req.body;

      // Validate required fields
      if (!language) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Language is required',
        });
        return;
      }

      const subtitle = await this.service.uploadSubtitle(
        file.buffer,
        file.originalname,
        {
          video_id,
          language,
          label,
          format,
          sync_offset: sync_offset ? parseFloat(sync_offset) : undefined,
        }
      );

      // Log audit
      await auditLogger.logAdminAction(
        (req as any).user?.userId || 'system',
        'UPLOAD_SUBTITLE',
        'subtitle',
        subtitle.id,
        undefined,
        { video_id, language }
      );

      const response: SubtitleResponse = this.toResponse(subtitle);

      res.status(201).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * GET /videos/:videoId/subtitles
   * Get all subtitles for a video
   */
  getSubtitles = async (req: Request, res: Response): Promise<void> => {
    try {
      const { videoId } = req.params;
      const subtitles = await this.service.getSubtitlesByVideoId(videoId);

      const response = {
        subtitles: subtitles.map(s => this.toResponse(s)),
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * GET /admin/subtitles/:id
   * Get subtitle by ID
   */
  getSubtitle = async (req: Request, res: Response): Promise<void> => {
    try {
      // This would need to be added to service/repository
      res.status(501).json({
        error: 'Not Implemented',
        message: 'Get subtitle by ID not yet implemented',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * PUT /admin/subtitles/:id
   * Update subtitle metadata
   */
  updateSubtitle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { label, sync_offset, metadata } = req.body;

      const subtitle = await this.service.updateSubtitle(id, {
        label,
        sync_offset: sync_offset ? parseFloat(sync_offset) : undefined,
        metadata,
      });

      // Log audit
      await auditLogger.logAdminAction(
        (req as any).user?.userId || 'system',
        'UPDATE_SUBTITLE',
        'subtitle',
        id,
        undefined,
        { label, sync_offset }
      );

      const response: SubtitleResponse = this.toResponse(subtitle);

      res.status(200).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * DELETE /admin/subtitles/:id
   * Delete subtitle
   */
  deleteSubtitle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await this.service.deleteSubtitle(id);

      // Log audit
      await auditLogger.logAdminAction(
        (req as any).user?.userId || 'system',
        'DELETE_SUBTITLE',
        'subtitle',
        id,
        undefined,
        undefined
      );

      res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * POST /admin/subtitles/validate
   * Validate subtitle file without saving
   */
  validateSubtitle = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Subtitle file is required',
        });
        return;
      }

      const { format } = req.body;
      const result = await this.service.validateFile(file.buffer, format || 'srt');

      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Convert database model to response format
   */
  private toResponse(subtitle: any): SubtitleResponse {
    return {
      id: subtitle.id,
      video_id: subtitle.video_id,
      language: subtitle.language,
      label: subtitle.label || undefined,
      subtitle_url: subtitle.subtitle_url,
      format: subtitle.format || 'vtt',
      sync_offset: subtitle.sync_offset || undefined,
      metadata: subtitle.metadata || undefined,
    };
  }

  /**
   * Handle errors
   */
  private handleError(error: unknown, res: Response): void {
    if (error instanceof SubtitleError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
      });
    } else if (error instanceof SubtitleNotFoundError) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: error.message,
      });
    } else {
      console.error('Subtitle error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      });
    }
  }
}

