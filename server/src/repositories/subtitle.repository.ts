/**
 * Subtitle Repository - Database operations for subtitles
 */

import { Pool } from 'pg';
import { SubtitleFile, SubtitleNotFoundError } from '../types/subtitle.types';

export class SubtitleRepository {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Find subtitle by ID
   */
  async findById(id: string): Promise<SubtitleFile | null> {
    const result = await this.db.query<SubtitleFile>(
      `
      SELECT *
      FROM subtitles
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Find subtitles by video ID
   */
  async findByVideoId(videoId: string): Promise<SubtitleFile[]> {
    const result = await this.db.query<SubtitleFile>(
      `
      SELECT *
      FROM subtitles
      WHERE video_id = $1
      ORDER BY language, created_at
      `,
      [videoId]
    );

    return result.rows;
  }

  /**
   * Find subtitle by video ID and language
   */
  async findByVideoIdAndLanguage(
    videoId: string,
    language: string
  ): Promise<SubtitleFile | null> {
    const result = await this.db.query<SubtitleFile>(
      `
      SELECT *
      FROM subtitles
      WHERE video_id = $1 AND language = $2
      LIMIT 1
      `,
      [videoId, language]
    );

    return result.rows[0] || null;
  }

  /**
   * Create subtitle
   */
  async create(subtitleData: {
    video_id: string;
    language: string;
    subtitle_url: string;
    subtitle_file_path?: string;
    label?: string;
    format?: string;
    sync_offset?: number;
    metadata?: any;
  }): Promise<SubtitleFile> {
    const result = await this.db.query<SubtitleFile>(
      `
      INSERT INTO subtitles (
        video_id, language, subtitle_url, subtitle_file_path, 
        label, sync_offset, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        subtitleData.video_id,
        subtitleData.language,
        subtitleData.subtitle_url,
        subtitleData.subtitle_file_path,
        subtitleData.label,
        subtitleData.sync_offset,
        subtitleData.metadata ? JSON.stringify(subtitleData.metadata) : null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Update subtitle
   */
  async update(
    id: string,
    updates: {
      subtitle_url?: string;
      subtitle_file_path?: string;
      label?: string;
      format?: string;
      sync_offset?: number;
      metadata?: any;
    }
  ): Promise<SubtitleFile> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.subtitle_url !== undefined) {
      fields.push(`subtitle_url = $${paramCount++}`);
      values.push(updates.subtitle_url);
    }
    if (updates.subtitle_file_path !== undefined) {
      fields.push(`subtitle_file_path = $${paramCount++}`);
      values.push(updates.subtitle_file_path);
    }
    if (updates.label !== undefined) {
      fields.push(`label = $${paramCount++}`);
      values.push(updates.label);
    }
    if (updates.sync_offset !== undefined) {
      fields.push(`sync_offset = $${paramCount++}`);
      values.push(updates.sync_offset);
    }
    if (updates.metadata !== undefined) {
      fields.push(`metadata = $${paramCount++}`);
      values.push(JSON.stringify(updates.metadata));
    }

    if (fields.length === 0) {
      const subtitle = await this.findById(id);
      if (!subtitle) {
        throw new SubtitleNotFoundError(id);
      }
      return subtitle;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.db.query<SubtitleFile>(
      `
      UPDATE subtitles
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
      `,
      values
    );

    if (!result.rows[0]) {
      throw new SubtitleNotFoundError(id);
    }

    return result.rows[0];
  }

  /**
   * Delete subtitle
   */
  async delete(id: string): Promise<void> {
    const result = await this.db.query(
      `
      DELETE FROM subtitles
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rowCount === 0) {
      throw new SubtitleNotFoundError(id);
    }
  }

  /**
   * Delete all subtitles for a video
   */
  async deleteByVideoId(videoId: string): Promise<void> {
    await this.db.query(
      `
      DELETE FROM subtitles
      WHERE video_id = $1
      `,
      [videoId]
    );
  }
}

