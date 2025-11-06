/**
 * SRT Parser - Parse and validate SRT subtitle files
 */

import fs from 'fs/promises';
import {
  SubtitleSegment,
  ParsedSubtitle,
  ValidationResult,
  InvalidSubtitleFormatError,
} from '../types/subtitle.types';

export class SRTParser {
  /**
   * Parse SRT file content into segments
   */
  static parse(content: string): ParsedSubtitle {
    const segments: SubtitleSegment[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    const lines = content.trim().split(/\r?\n/);
    let i = 0;
    let currentIndex = 0;

    while (i < lines.length) {
      // Skip empty lines
      if (!lines[i].trim()) {
        i++;
        continue;
      }

      // Read subtitle index
      const index = parseInt(lines[i], 10);
      if (isNaN(index)) {
        errors.push(`Line ${i + 1}: Invalid subtitle index`);
        i++;
        continue;
      }

      // Validate sequence
      if (index !== currentIndex + 1) {
        warnings.push(`Line ${i + 1}: Non-sequential index (expected ${currentIndex + 1}, got ${index})`);
      }
      currentIndex = index;

      i++;

      // Read timestamp line
      if (i >= lines.length) {
        errors.push(`Line ${i}: Missing timestamp after index ${index}`);
        break;
      }

      const timestampMatch = lines[i].match(/^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/);
      if (!timestampMatch) {
        errors.push(`Line ${i + 1}: Invalid timestamp format`);
        i++;
        continue;
      }

      const [, h1, m1, s1, ms1, h2, m2, s2, ms2] = timestampMatch;
      const startTime = `${h1}:${m1}:${s1}.${ms1}`;
      const endTime = `${h2}:${m2}:${s2}.${ms2}`;

      const rawStart = this.timeToMs(h1, m1, s1, ms1);
      const rawEnd = this.timeToMs(h2, m2, s2, ms2);

      if (rawStart >= rawEnd) {
        errors.push(`Line ${i + 1}: Start time must be before end time`);
      }

      // Check for gaps/overlaps
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        if (rawStart > lastSegment.rawEnd) {
          warnings.push(`Segment ${index}: Gap detected (${(rawStart - lastSegment.rawEnd) / 1000}s)`);
        } else if (rawStart < lastSegment.rawEnd) {
          warnings.push(`Segment ${index}: Overlap detected`);
        }
      }

      i++;

      // Read subtitle text
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim()) {
        textLines.push(lines[i].trim());
        i++;
      }

      if (textLines.length === 0) {
        errors.push(`Segment ${index}: Empty subtitle text`);
        continue;
      }

      const text = textLines.join('\n');

      // Validate text length
      if (text.length > 200) {
        warnings.push(`Segment ${index}: Text is very long (${text.length} chars)`);
      }

      segments.push({
        index,
        startTime,
        endTime,
        text,
        rawStart,
        rawEnd,
      });
    }

    return {
      segments,
      language: 'unknown',
      format: 'srt',
      errors,
      warnings,
    };
  }

  /**
   * Parse SRT file from path
   */
  static async parseFile(filePath: string): Promise<ParsedSubtitle> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return this.parse(content);
    } catch (error) {
      throw new InvalidSubtitleFormatError(`Failed to read file: ${error}`);
    }
  }

  /**
   * Validate parsed subtitle
   */
  static validate(parsed: ParsedSubtitle): ValidationResult {
    const { segments, errors, warnings } = parsed;

    // Check for critical errors
    const hasCriticalErrors = errors.length > 0;

    // Calculate total duration
    const duration = segments.length > 0 
      ? Math.max(...segments.map(s => s.rawEnd)) / 1000
      : 0;

    return {
      valid: !hasCriticalErrors && segments.length > 0,
      errors,
      warnings,
      duration,
      segmentCount: segments.length,
    };
  }

  /**
   * Convert time components to milliseconds
   */
  private static timeToMs(
    hours: string,
    minutes: string,
    seconds: string,
    milliseconds: string
  ): number {
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const s = parseInt(seconds, 10);
    const ms = parseInt(milliseconds, 10);

    return h * 3600000 + m * 60000 + s * 1000 + ms;
  }
}

