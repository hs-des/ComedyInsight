/**
 * Subtitle Service - Business logic for subtitle operations
 */

import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { SubtitleRepository } from '../repositories/subtitle.repository';
import { SubtitleConverter } from '../utils/subtitle-converter';
import { SRTParser } from '../utils/srt-parser';
import {
  SubtitleFile,
  SubtitleUploadRequest,
  SubtitleError,
  ValidationResult,
} from '../types/subtitle.types';

export class SubtitleService {
  private repository: SubtitleRepository;
  private uploadDir: string;

  constructor(db: Pool) {
    this.repository = new SubtitleRepository(db);
    this.uploadDir = process.env.UPLOAD_DIR || './uploads/subtitles';
    this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  /**
   * Upload and process subtitle file
   */
  async uploadSubtitle(
    fileBuffer: Buffer,
    filename: string,
    data: SubtitleUploadRequest
  ): Promise<SubtitleFile> {
    // Determine format from extension
    const ext = path.extname(filename).toLowerCase().substring(1);
    const format = ext === 'srt' || ext === 'vtt' ? ext : 'srt';

    // Parse and validate if SRT
    let validationResult: ValidationResult | null = null;
    if (format === 'srt') {
      const content = fileBuffer.toString('utf-8');
      const parsed = SRTParser.parse(content);
      validationResult = SRTParser.validate(parsed);

      if (!validationResult.valid) {
        throw new SubtitleError(
          `Invalid SRT file: ${validationResult.errors.join(', ')}`,
          'INVALID_FILE',
          400
        );
      }
    }

    // Save original file
    const fileId = this.generateFileId();
    const originalExt = format;
    const originalPath = path.join(
      this.uploadDir,
      `${fileId}.${originalExt}`
    );
    await fs.writeFile(originalPath, fileBuffer);

    // Convert SRT to VTT and save, or use VTT as-is
    let vttPath: string | undefined;
    let finalFormat = format;
    let fileIdForUrl = fileId;

    if (format === 'srt') {
      // SRT: convert to VTT
      vttPath = path.join(this.uploadDir, `${fileId}.vtt`);
      const vttContent = SubtitleConverter.srtToVtt(fileBuffer.toString('utf-8'));
      await fs.writeFile(vttPath, vttContent);
      finalFormat = 'vtt';
      fileIdForUrl = fileId;
    } else if (format === 'vtt') {
      // VTT: use as-is
      vttPath = originalPath;
      finalFormat = 'vtt';
      fileIdForUrl = fileId;
    }

    // Generate URL
    const subtitleUrl = this.generateUrl(fileIdForUrl, finalFormat);

    // Store in database
    const subtitle = await this.repository.create({
      video_id: data.video_id,
      language: data.language,
      subtitle_url: subtitleUrl,
      subtitle_file_path: vttPath || originalPath,
      label: data.label,
      format: finalFormat,
      sync_offset: data.sync_offset,
      metadata: {
        ...data.metadata,
        originalFormat: format,
        validation: validationResult,
      },
    });

    return subtitle;
  }

  /**
   * Get subtitles for a video
   */
  async getSubtitlesByVideoId(videoId: string): Promise<SubtitleFile[]> {
    return this.repository.findByVideoId(videoId);
  }

  /**
   * Update subtitle
   */
  async updateSubtitle(
    id: string,
    updates: {
      label?: string;
      sync_offset?: number;
      metadata?: any;
    }
  ): Promise<SubtitleFile> {
    return this.repository.update(id, updates);
  }

  /**
   * Delete subtitle and files
   */
  async deleteSubtitle(id: string): Promise<void> {
    const subtitle = await this.repository.findById(id);
    if (!subtitle) {
      return;
    }

    // Delete files
    if (subtitle.subtitle_file_path) {
      try {
        await fs.unlink(subtitle.subtitle_file_path);
      } catch (error) {
        console.error('Failed to delete subtitle file:', error);
      }
    }

    // Delete from database
    await this.repository.delete(id);
  }

  /**
   * Validate subtitle file without saving
   */
  async validateFile(fileBuffer: Buffer, format: string): Promise<ValidationResult> {
    if (format !== 'srt') {
      return {
        valid: true,
        errors: [],
        warnings: [],
        segmentCount: 0,
      };
    }

    const content = fileBuffer.toString('utf-8');
    const parsed = SRTParser.parse(content);
    return SRTParser.validate(parsed);
  }

  /**
   * Generate unique file ID
   */
  private generateFileId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * Generate public URL for subtitle
   */
  private generateUrl(fileId: string, format: string): string {
    const baseUrl = process.env.SUBTITLE_BASE_URL || 'http://localhost:3000/subtitles';
    return `${baseUrl}/${fileId}.${format}`;
  }
}

