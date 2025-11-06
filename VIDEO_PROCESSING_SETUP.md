# Automatic Video Quality Transcoding Setup

## Overview

The system now automatically generates multiple quality versions (1440p, 1080p, 720p, 480p, 360p) when a video is uploaded. Processing happens asynchronously in the background using a queue system.

## Features

- **Automatic Quality Detection**: Determines source video resolution and generates appropriate quality versions
- **Multiple Qualities**: Creates 1440p, 1080p, 720p, 480p, and 360p versions (based on source)
- **Async Processing**: Uses BullMQ queue system for background processing
- **S3 Storage**: Each quality version is stored separately in S3
- **Database Tracking**: All quality variants stored in `video_variants` table
- **Duration Extraction**: Automatically calculates video duration during processing
- **Progress Tracking**: Video status tracked in metadata (queued, processing, completed, failed)

## Installation

### 1. Install FFmpeg

The system requires FFmpeg to be installed on the server.

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html or use:
```bash
npm install -g @ffmpeg-installer/ffmpeg
```

### 2. Install Node.js Dependencies

```bash
cd server
npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg
```

Or using yarn:
```bash
cd server
yarn add fluent-ffmpeg @ffmpeg-installer/ffmpeg
```

### 3. Update Docker (if using Docker)

If using Docker, update your Dockerfile to install FFmpeg:

```dockerfile
# Add to Dockerfile
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
```

Or if using the node base image, you may need to switch to a Debian-based image.

## How It Works

### Upload Flow

1. User uploads video via admin dashboard
2. Video file is uploaded to S3 (original file)
3. Video metadata is saved to database with status "queued"
4. Video processing job is queued in Redis/BullMQ
5. API returns success immediately (processing happens in background)

### Processing Flow

1. Worker picks up job from queue
2. Video dimensions are detected
3. Appropriate quality versions are generated:
   - If source is 2K (1440p), generates: 1440p, 1080p, 720p, 480p, 360p
   - If source is 1080p, generates: 1080p, 720p, 480p, 360p
   - And so on...
4. Each quality is transcoded and uploaded to S3
5. Quality variants are saved to `video_variants` table
6. Main video record is updated with highest quality URL
7. Video duration is extracted and saved
8. Status updated to "completed"

## Database Schema

Quality variants are stored in the `video_variants` table:

```sql
CREATE TABLE video_variants (
    id UUID PRIMARY KEY,
    video_id UUID REFERENCES videos(id),
    quality VARCHAR(20), -- '1440p', '1080p', etc.
    video_url TEXT,
    file_size_mb DECIMAL(10, 2),
    mime_type VARCHAR(100),
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(video_id, quality)
);
```

## Configuration

### Quality Settings

Quality configurations are in `server/src/services/video-processing.service.ts`:

```typescript
private qualities: VideoQuality[] = [
  { quality: '1440p', width: 2560, height: 1440, videoBitrate: '8000k', audioBitrate: '192k' },
  { quality: '1080p', width: 1920, height: 1080, videoBitrate: '5000k', audioBitrate: '192k' },
  { quality: '720p', width: 1280, height: 720, videoBitrate: '2500k', audioBitrate: '128k' },
  { quality: '480p', width: 854, height: 480, videoBitrate: '1000k', audioBitrate: '128k' },
  { quality: '360p', width: 640, height: 360, videoBitrate: '500k', audioBitrate: '96k' },
];
```

### Worker Concurrency

Adjust concurrent processing in `server/src/workers/video-processing.worker.ts`:

```typescript
concurrency: 2, // Process 2 videos concurrently
```

## API Changes

### Upload Endpoint

**POST /api/videos**

- Quality field is now **automated** (removed from frontend form)
- Video is uploaded and queued for processing
- Returns immediately with video ID
- Processing status tracked in `videos.metadata.processing_status`

### Response

```json
{
  "message": "Video uploaded successfully",
  "video": {
    "id": "uuid",
    "title": "Video Title",
    "slug": "video-title-abc123",
    "video_url": "s3://bucket/videos/original.mp4",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

## Monitoring

### Check Processing Status

Query the videos table:
```sql
SELECT 
  id, 
  title, 
  metadata->>'processing_status' as status,
  metadata->>'processed_qualities' as qualities
FROM videos 
WHERE id = 'video-id';
```

Status values:
- `queued` - Waiting to be processed
- `processing` - Currently being transcoded
- `completed` - All qualities generated successfully
- `failed` - Processing failed (check logs)

### View Quality Variants

```sql
SELECT quality, video_url, file_size_mb, is_active
FROM video_variants
WHERE video_id = 'video-id'
ORDER BY 
  CASE quality
    WHEN '1440p' THEN 1
    WHEN '1080p' THEN 2
    WHEN '720p' THEN 3
    WHEN '480p' THEN 4
    WHEN '360p' THEN 5
  END;
```

## Troubleshooting

### FFmpeg Not Found

Ensure FFmpeg is installed and in PATH:
```bash
ffmpeg -version
```

For Node.js, you can specify FFmpeg path:
```typescript
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
```

### Processing Fails

1. Check worker logs for error messages
2. Verify S3 credentials and bucket permissions
3. Check Redis connection for queue system
4. Ensure sufficient disk space for transcoding

### Video Quality Issues

- Adjust bitrate settings in `video-processing.service.ts`
- Modify preset from 'fast' to 'medium' or 'slow' for better quality (slower)
- Check source video codec compatibility

## Performance Considerations

- **CPU Usage**: Video transcoding is CPU-intensive
- **Memory**: Large videos require significant RAM
- **Storage**: Multiple quality versions increase storage needs
- **Processing Time**: Depends on video length and server capacity

Recommendations:
- Use dedicated worker servers for processing
- Scale workers horizontally based on upload volume
- Monitor queue depth and processing times
- Consider cloud transcoding services for high volume

## Next Steps

1. Install FFmpeg on server
2. Install npm dependencies
3. Update Dockerfile if using Docker
4. Restart server to load video processing worker
5. Test upload and verify quality variants are created
