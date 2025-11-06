/**
 * Subtitle Converter - Convert between subtitle formats
 */

import { SRTParser } from './srt-parser';
import { ParsedSubtitle } from '../types/subtitle.types';
import {
  SubtitleConversionError,
  SubtitleSegment,
} from '../types/subtitle.types';
import fs from 'fs/promises';
import path from 'path';

export class SubtitleConverter {
  /**
   * Convert SRT content to VTT
   */
  static srtToVtt(srtContent: string): string {
    try {
      // Parse SRT
      const parsed = SRTParser.parse(srtContent);

      if (parsed.errors.length > 0) {
        throw new SubtitleConversionError(
          `SRT parsing errors: ${parsed.errors.join(', ')}`
        );
      }

      // Convert to VTT
      let vtt = 'WEBVTT\n\n';

      for (const segment of parsed.segments) {
        // Convert timestamp format: 00:00:00.000 --> 00:00:00.000
        const startTime = this.convertTimestamp(segment.startTime);
        const endTime = this.convertTimestamp(segment.endTime);

        vtt += `${startTime} --> ${endTime}\n`;
        vtt += `${segment.text}\n\n`;
      }

      return vtt;
    } catch (error) {
      if (error instanceof SubtitleConversionError) {
        throw error;
      }
      throw new SubtitleConversionError(
        `Failed to convert SRT to VTT: ${error}`
      );
    }
  }

  /**
   * Convert SRT file to VTT file
   */
  static async convertFile(
    inputPath: string,
    outputPath?: string
  ): Promise<string> {
    try {
      // Read input file
      const content = await fs.readFile(inputPath, 'utf-8');

      // Convert
      const vttContent = this.srtToVtt(content);

      // Determine output path
      const finalOutputPath =
        outputPath || inputPath.replace(/\.srt$/i, '.vtt');

      // Write output file
      await fs.writeFile(finalOutputPath, vttContent, 'utf-8');

      return finalOutputPath;
    } catch (error) {
      if (error instanceof SubtitleConversionError) {
        throw error;
      }
      throw new SubtitleConversionError(
        `File conversion failed: ${error}`
      );
    }
  }

  /**
   * Convert timestamp from SRT format to VTT format
   * SRT: 00:00:00,000 or 00:00:00.000
   * VTT: 00:00:00.000 (always dot separator)
   */
  private static convertTimestamp(timestamp: string): string {
    // Replace comma with dot if present
    return timestamp.replace(',', '.');
  }
}

