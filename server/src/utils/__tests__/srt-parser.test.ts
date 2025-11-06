/**
 * SRT Parser Unit Tests
 */

import { SRTParser } from '../srt-parser';

describe('SRTParser', () => {
  describe('parse', () => {
    it('should parse valid SRT content', () => {
      const srtContent = `
1
00:00:00,000 --> 00:00:03,000
Welcome to ComedyInsight!

2
00:00:03,500 --> 00:00:06,000
Enjoy your viewing experience
      `.trim();

      const result = SRTParser.parse(srtContent);

      expect(result.segments).toHaveLength(2);
      expect(result.segments[0].text).toBe('Welcome to ComedyInsight!');
      expect(result.segments[1].text).toBe('Enjoy your viewing experience');
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid timestamps', () => {
      const srtContent = `
1
00:00:03,000 --> 00:00:00,000
Invalid timestamp
      `.trim();

      const result = SRTParser.parse(srtContent);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Start time must be before end time');
    });

    it('should detect gaps and overlaps', () => {
      const srtContent = `
1
00:00:00,000 --> 00:00:02,000
First subtitle

2
00:00:05,000 --> 00:00:07,000
Gap here
      `.trim();

      const result = SRTParser.parse(srtContent);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Gap detected');
    });

    it('should handle empty subtitle text', () => {
      const srtContent = `
1
00:00:00,000 --> 00:00:03,000

2
00:00:04,000 --> 00:00:07,000
Valid text
      `.trim();

      const result = SRTParser.parse(srtContent);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Empty subtitle text');
    });
  });

  describe('validate', () => {
    it('should validate correct subtitles', () => {
      const parsed = {
        segments: [
          {
            index: 1,
            startTime: '00:00:00,000',
            endTime: '00:00:03,000',
            text: 'Test',
            rawStart: 0,
            rawEnd: 3000,
          },
        ],
        language: 'en',
        format: 'srt',
        errors: [],
        warnings: [],
      };

      const result = SRTParser.validate(parsed);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail on critical errors', () => {
      const parsed = {
        segments: [],
        language: 'en',
        format: 'srt',
        errors: ['Critical error'],
        warnings: [],
      };

      const result = SRTParser.validate(parsed);

      expect(result.valid).toBe(false);
    });
  });
});

