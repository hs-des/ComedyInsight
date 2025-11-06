# Docker Updates for Video Processing Features

## Overview

The Docker configuration has been updated to support automatic video quality transcoding and processing features.

## Changes Made

### 1. Dockerfile Updates

**Added FFmpeg Installation:**
- FFmpeg is now installed in the Docker image for video transcoding
- Required for generating multiple quality versions (1440p, 1080p, 720p, 480p, 360p)

**Updated Dockerfile:**
```dockerfile
# Install system dependencies including FFmpeg for video processing
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    ca-certificates \
    gnupg \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Verify Node.js and FFmpeg installation
RUN node --version && npm --version && ffmpeg -version
```

### 2. Docker Compose Configuration

**Services Included:**
- ✅ **PostgreSQL** - Database for video metadata and quality variants
- ✅ **Redis** - Queue system for async video processing jobs
- ✅ **MinIO** - S3-compatible storage for video files (all quality versions)
- ✅ **Node.js App** - Backend server with FFmpeg support
- ✅ **pgAdmin** - Database management interface

**Environment Variables:**
- `REDIS_HOST` and `REDIS_PORT` - For BullMQ video processing queues
- `AWS_S3_ENDPOINT` - MinIO endpoint for video storage
- `AWS_S3_BUCKET` - Bucket name for storing videos
- All S3/MinIO credentials configured

## Setup Instructions

### 1. Build and Start Containers

```bash
docker compose up --build
```

### 2. Create MinIO Bucket for Videos

After containers start, create the video storage bucket:

```bash
# Set up MinIO alias
docker compose exec minio mc alias set myminio http://localhost:9000 admin change-me-secure-password

# Create bucket
docker compose exec minio mc mb myminio/comedyinsight-videos

# Make bucket accessible for downloads (optional)
docker compose exec minio mc anonymous set download myminio/comedyinsight-videos
```

### 3. Verify Services

**Check all services are running:**
```bash
docker compose ps
```

**Verify FFmpeg in app container:**
```bash
docker compose exec app ffmpeg -version
```

**Check Redis connection:**
```bash
docker compose exec redis redis-cli ping
# Should return: PONG
```

**Verify MinIO:**
- Console: http://localhost:9001
- API: http://localhost:9000

## Video Processing Flow in Docker

1. **Upload**: Video uploaded via admin dashboard → Stored in MinIO
2. **Queue**: Processing job added to Redis queue
3. **Worker**: VideoProcessingWorker picks up job
4. **Transcode**: FFmpeg creates multiple quality versions
5. **Store**: Each quality version uploaded to MinIO
6. **Database**: Quality variants saved to PostgreSQL

## Storage Structure in MinIO

```
comedyinsight-videos/
├── videos/
│   ├── {videoId}.mp4              (original)
│   ├── 1440p/
│   │   └── {videoId}.mp4
│   ├── 1080p/
│   │   └── {videoId}.mp4
│   ├── 720p/
│   │   └── {videoId}.mp4
│   ├── 480p/
│   │   └── {videoId}.mp4
│   └── 360p/
│       └── {videoId}.mp4
```

## Performance Considerations

### Resource Requirements

- **CPU**: Video transcoding is CPU-intensive
- **Memory**: Large videos require significant RAM
- **Storage**: Multiple quality versions increase storage needs
- **Network**: Video uploads/downloads use bandwidth

### Recommendations

1. **Allocate Sufficient Resources:**
   ```yaml
   # In docker-compose.yml (if needed)
   app:
     deploy:
       resources:
         limits:
           cpus: '2'
           memory: 4G
   ```

2. **Monitor Queue Depth:**
   - Check Redis queue length
   - Adjust worker concurrency if needed

3. **Storage Management:**
   - Monitor MinIO storage usage
   - Consider lifecycle policies for old videos

## Troubleshooting

### FFmpeg Not Found

If FFmpeg is missing, rebuild the Docker image:
```bash
docker compose build --no-cache app
docker compose up -d app
```

### Redis Connection Issues

Check Redis is healthy:
```bash
docker compose exec redis redis-cli ping
```

Check app logs:
```bash
docker compose logs app | grep -i redis
```

### MinIO Connection Issues

Verify MinIO is accessible:
```bash
curl http://localhost:9000/minio/health/live
```

Check bucket exists:
```bash
docker compose exec minio mc ls myminio/
```

### Video Processing Fails

Check worker logs:
```bash
docker compose logs app | grep -i "video processing"
```

Check Redis queue:
```bash
docker compose exec redis redis-cli
> KEYS *
> LLEN bull:process-video:wait
```

## Production Deployment

### Security Checklist

- [ ] Change `MINIO_ROOT_PASSWORD` and `AWS_SECRET_ACCESS_KEY`
- [ ] Change `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- [ ] Change `JWT_SECRET`
- [ ] Use environment files for sensitive data
- [ ] Enable SSL/TLS for MinIO
- [ ] Configure proper firewall rules
- [ ] Set up backups for PostgreSQL and MinIO

### Environment File Example

Create `.env` file:
```env
MINIO_ROOT_PASSWORD=secure-random-password
AWS_SECRET_ACCESS_KEY=secure-random-password
ADMIN_PASSWORD=secure-admin-password
JWT_SECRET=secure-random-jwt-secret
```

Update docker-compose.yml to use `.env`:
```yaml
environment:
  MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
  AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
```

## Next Steps

1. Rebuild Docker images: `docker compose up --build`
2. Create MinIO bucket for videos
3. Test video upload and verify quality variants are created
4. Monitor processing performance and adjust resources if needed
5. Set up backups and monitoring for production
