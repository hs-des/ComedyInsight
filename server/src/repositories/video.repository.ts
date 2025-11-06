/**
 * Video Repository - Database operations for videos
 */

import { Pool } from 'pg';

export interface Video {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  video_url: string;
  duration_seconds?: number;
  video_type: string;
  quality: string;
  file_size_mb?: number;
  mime_type?: string;
  language: string;
  subtitles_available: boolean;
  is_featured: boolean;
  is_premium: boolean;
  is_active: boolean;
  published_at?: Date;
  metadata?: any;
  tags?: string[];
  artist?: string;
  view_count?: number;
  status?: string;
  created_at: Date;
  updated_at: Date;
}

export interface VideoCreate {
  title: string;
  slug?: string;
  description?: string;
  thumbnail_url?: string;
  video_url: string;
  duration_seconds?: number;
  video_type: string;
  quality: string;
  file_size_mb?: number;
  mime_type?: string;
  language?: string;
  subtitles_available?: boolean;
  is_featured?: boolean;
  is_premium?: boolean;
  is_active?: boolean;
  published_at?: Date;
  metadata?: any;
  tags?: string[];
  artist?: string;
}

export class VideoRepository {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Generate slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Create a new video
   */
  async create(data: VideoCreate): Promise<Video> {
    const slug = data.slug || this.generateSlug(data.title);

    const result = await this.db.query<Video>(
      `
      INSERT INTO videos (
        title, slug, description, thumbnail_url, video_url,
        duration_seconds, video_type, quality, file_size_mb, mime_type,
        language, subtitles_available, is_featured, is_premium,
        is_active, published_at, metadata, tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
      `,
      [
        data.title,
        slug,
        data.description || null,
        data.thumbnail_url || null,
        data.video_url,
        data.duration_seconds || null,
        data.video_type,
        data.quality,
        data.file_size_mb || null,
        data.mime_type || null,
        data.language || 'en',
        data.subtitles_available || false,
        data.is_featured || false,
        data.is_premium || false,
        data.is_active !== undefined ? data.is_active : true,
        data.published_at || null,
        data.metadata ? JSON.stringify(data.metadata) : null,
        data.tags || null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Find video by ID
   */
  async findById(id: string): Promise<Video | null> {
    const result = await this.db.query<Video>(
      'SELECT * FROM videos WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find all videos
   */
  async findAll(limit: number = 100, offset: number = 0): Promise<Video[]> {
    const result = await this.db.query<Video>(
      'SELECT * FROM videos ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  /**
   * Update video
   */
  async update(id: string, updates: Partial<VideoCreate>): Promise<Video | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        if (key === 'metadata' && typeof value === 'object') {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await this.db.query<Video>(
      `UPDATE videos SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Delete video
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(
      'DELETE FROM videos WHERE id = $1',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}
