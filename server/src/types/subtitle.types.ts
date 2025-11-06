/**
 * Subtitle module types and interfaces
 */

export interface SubtitleFile {
  id: string;
  video_id: string;
  language: string;
  label?: string;
  subtitle_url: string;
  subtitle_file_path?: string;
  format: 'srt' | 'vtt';
  sync_offset?: number; // Seconds
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface SubtitleUploadRequest {
  video_id: string;
  language: string;
  label?: string;
  format: 'srt' | 'vtt';
  sync_offset?: number;
  metadata?: Record<string, any>;
}

export interface SubtitleResponse {
  id: string;
  video_id: string;
  language: string;
  label?: string;
  subtitle_url: string;
  format: string;
  sync_offset?: number;
  metadata?: Record<string, any>;
}

export interface SubtitleListResponse {
  subtitles: SubtitleResponse[];
}

export interface SubtitleSegment {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
  rawStart: number; // Milliseconds
  rawEnd: number; // Milliseconds
}

export interface ParsedSubtitle {
  segments: SubtitleSegment[];
  language: string;
  format: string;
  errors: string[];
  warnings: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  duration?: number; // Total subtitle duration in seconds
  segmentCount: number;
}

export class SubtitleError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'SubtitleError';
  }
}

export class SubtitleNotFoundError extends SubtitleError {
  constructor(subtitleId?: string) {
    super(
      subtitleId ? `Subtitle ${subtitleId} not found` : 'Subtitle not found',
      'SUBTITLE_NOT_FOUND',
      404
    );
  }
}

export class InvalidSubtitleFormatError extends SubtitleError {
  constructor(message: string) {
    super(message, 'INVALID_FORMAT', 400);
  }
}

export class SubtitleConversionError extends SubtitleError {
  constructor(message: string) {
    super(message, 'CONVERSION_FAILED', 500);
  }
}

