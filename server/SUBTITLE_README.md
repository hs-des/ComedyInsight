# Subtitle Module

Complete subtitle management implementation for ComedyInsight API.

## Overview

The subtitle module provides:
- **Upload** .srt and .vtt subtitle files
- **Automatic SRT to VTT conversion** for browser compatibility
- **Multi-language support** with metadata
- **Validation** with SRT parsing and error detection
- **CRUD operations** for admin management
- **Public API** for retrieving subtitles

## Architecture

```
subtitle/
├── types/
│   └── subtitle.types.ts         # Interfaces and types
├── utils/
│   ├── srt-parser.ts             # SRT parsing & validation
│   ├── subtitle-converter.ts     # SRT to VTT conversion
│   └── __tests__/
│       └── srt-parser.test.ts    # Unit tests
├── services/
│   └── subtitle.service.ts       # Business logic
├── repositories/
│   └── subtitle.repository.ts    # Database operations
├── controllers/
│   └── subtitle.controller.ts    # Request handlers
├── middleware/
│   └── upload.middleware.ts      # File upload handling
├── routes/
│   └── subtitle.routes.ts        # Route definitions
└── test-data/
    ├── sample.srt                # Valid SRT example
    └── sample-invalid.srt        # Invalid SRT example
```

## Features

### SRT to VTT Conversion
- Automatically converts `.srt` files to `.vtt` format
- Validates SRT structure during conversion
- Saves both original and converted formats
- Serves VTT to clients for browser compatibility

### Validation
- Parses SRT structure
- Detects invalid timestamps
- Identifies gaps and overlaps
- Validates text content
- Returns detailed errors and warnings

### Metadata Support
- Language codes (ISO 639-1)
- Custom labels ("English (US)", "Español")
- Sync offset for timing adjustments
- Custom metadata as JSONB

## API Endpoints

### Public

**GET** `/videos/:videoId/subtitles`
- Get all subtitles for a video
- Returns: `{ subtitles: [...] }`

### Admin (Requires JWT)

**POST** `/admin/videos/:video_id/subtitles`
- Upload subtitle file
- Accepts: `.srt`, `.vtt`
- Returns: Subtitle details

**PUT** `/admin/subtitles/:id`
- Update subtitle metadata
- Returns: Updated subtitle

**DELETE** `/admin/subtitles/:id`
- Delete subtitle and files
- Returns: 204 No Content

**POST** `/admin/subtitles/validate`
- Validate file without saving
- Returns: Validation results

## File Formats

### Input Formats
- `.srt` - SubRip (auto-converted to VTT)
- `.vtt` - WebVTT (used as-is)

### Output Format
- All subtitles served as `.vtt`

### File Size Limit
- Maximum: 5MB

## SRT Format Support

### Supported Features
- Sequential subtitle indices
- Multi-line text
- Timestamp format: `HH:MM:SS,mmm`
- Comma or dot millisecond separator

### Validation Rules
- Start time < End time
- Non-empty text content
- Valid timestamp format
- Sequential indices (warning if not)

### Warnings
- Gaps between segments
- Overlaps between segments
- Very long text (>200 chars)
- Non-sequential indices

## Database Schema

```sql
CREATE TABLE subtitles (
    id UUID PRIMARY KEY,
    video_id UUID REFERENCES videos(id),
    language VARCHAR(10) NOT NULL,
    subtitle_url TEXT NOT NULL,
    subtitle_file_path TEXT,
    label VARCHAR(100),
    format VARCHAR(10) DEFAULT 'vtt',
    sync_offset INTEGER,
    metadata JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(video_id, language)
);
```

## Environment Variables

```env
# Subtitle upload directory
UPLOAD_DIR=./uploads/subtitles

# Base URL for subtitle files
SUBTITLE_BASE_URL=http://localhost:3000/subtitles
```

## Usage Examples

### Upload SRT File

```bash
curl -X POST http://localhost:3000/admin/videos/abc-123/subtitles \
  -H "Authorization: Bearer JWT_TOKEN" \
  -F "subtitle_file=@english.srt" \
  -F "language=en" \
  -F "label=English"
```

### Get Subtitles

```bash
curl http://localhost:3000/videos/abc-123/subtitles
```

### Validate File

```bash
curl -X POST http://localhost:3000/admin/subtitles/validate \
  -H "Authorization: Bearer JWT_TOKEN" \
  -F "subtitle_file=@test.srt"
```

## Testing

### Unit Tests

```bash
# Run subtitle tests
yarn test subtitle

# Run with coverage
yarn test:coverage
```

### Manual Testing

See `SUBTITLE_API_EXAMPLES.md` for complete curl examples.

## Sample SRT File

```
1
00:00:00,000 --> 00:00:03,000
Welcome to ComedyInsight!

2
00:00:03,500 --> 00:00:06,000
Enjoy your viewing experience

3
00:00:07,000 --> 00:00:10,500
We have the best comedy content
```

## Error Handling

### Validation Errors
- Invalid timestamp format
- Empty subtitle text
- Start time after end time
- File too large (>5MB)
- Unsupported file type

### Server Errors
- File system errors
- Database connection failures
- Conversion errors

## Performance Considerations

### Optimizations
- File processing is synchronous (can be made async)
- Files stored locally (can be moved to S3/cloud storage)
- No caching (can add Redis cache)

### Scaling
- Use cloud storage (S3, GCS)
- Implement CDN for subtitle delivery
- Add database indexes on video_id and language
- Async file processing queue

## Production Checklist

- [ ] Configure cloud storage (S3/GCS)
- [ ] Set up CDN for subtitle files
- [ ] Configure CORS properly
- [ ] Add rate limiting
- [ ] Implement presigned URLs
- [ ] Set up monitoring
- [ ] Add backup strategy
- [ ] Enable HTTPS only
- [ ] Test with large files
- [ ] Verify all language codes

## Dependencies

### New Packages
- `multer` - File upload handling
- `@types/multer` - TypeScript types

### Existing Packages
- `pg` - Database access
- `fs/promises` - File system
- `path` - Path utilities

## Migration Notes

The subtitle table is already defined in the initial schema migration:
```sql
-- Run migration
psql -U postgres -d comedyinsight -f migrations/001_initial_schema.sql
```

## Troubleshooting

### Files Not Saving
- Check `UPLOAD_DIR` permissions
- Verify disk space
- Check file system errors in logs

### Conversion Failing
- Verify SRT file format
- Check file encoding (must be UTF-8)
- Validate timestamp format

### 404 on Subtitle URLs
- Ensure static file serving is enabled
- Check file path in database
- Verify file exists in upload directory

## Next Steps

1. Add cloud storage integration (S3)
2. Implement presigned URLs
3. Add subtitle translation API
4. Support ASS/SSA formats
5. Add subtitle editing interface
6. Implement auto-translation
7. Add subtitle analytics

## Support

For issues:
- Check logs: `yarn dev` output
- Verify database connection
- Test with sample files in `test-data/`

