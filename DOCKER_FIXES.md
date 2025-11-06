# 🐳 Docker Fixes - ComedyInsight MVP

## ✅ Fixes Applied to Docker

All three fixes have been applied to the Docker configuration:

### 1. ✅ Mobile App Assets
- **Status**: Not applicable to Docker (mobile app runs separately via Expo)
- **Note**: Mobile assets are generated locally, not in containers

### 2. ✅ MinIO/S3 Service
- **Status**: ✅ **FIXED in Docker**
- **Changes Made**:
  1. Added MinIO service to `docker-compose.yml`
  2. Added S3/MinIO environment variables to `app` service
  3. Added MinIO volume for persistent storage
  4. Added health check for MinIO service
  5. Added MinIO dependency to `app` service

### 3. ✅ Admin Dashboard
- **Status**: Not applicable to Docker (admin dashboard runs separately)
- **Note**: Admin dashboard runs via `yarn dev` locally

## 📋 Docker Changes Summary

### Files Modified:
- `docker-compose.yml` - Added MinIO service and S3 environment variables

### Files Automatically Included:
- `server/src/services/s3.service.ts` - ✅ Included (copied by Dockerfile)
- `server/src/services/download.service.ts` - ✅ Included (copied by Dockerfile)
- `server/env.example` - ✅ Included (reference only)

### New Services in docker-compose.yml:
- **minio** - S3-compatible object storage service
  - Port 9000: S3 API
  - Port 9001: Web Console
  - Volume: `minio_data` for persistent storage

### Environment Variables Added to `app` Service:
```yaml
AWS_S3_ENDPOINT: http://minio:9000
AWS_S3_REGION: us-east-1
AWS_ACCESS_KEY_ID: admin
AWS_SECRET_ACCESS_KEY: change-me-secure-password
AWS_S3_BUCKET: comedyinsight-videos
AWS_S3_USE_PATH_STYLE: "true"
```

## 🔨 Do You Need to Rebuild Docker?

### ✅ **YES - You Need to Rebuild**

The Docker image needs to be rebuilt because:
1. **New code files**: `server/src/services/s3.service.ts` (new file)
2. **Updated code**: `server/src/services/download.service.ts` (modified)
3. **New service**: MinIO service added to docker-compose.yml
4. **New dependencies**: Already included in `package.json` (no change needed)

## 🚀 Rebuild Instructions

### Option 1: Full Rebuild (Recommended)

```bash
# Stop existing containers
docker compose down

# Rebuild and start all services
docker compose up --build -d

# View logs
docker compose logs -f app
```

### Option 2: Rebuild Only App Service

```bash
# Stop app service
docker compose stop app

# Rebuild app image
docker compose build app

# Start all services
docker compose up -d
```

### Option 3: Clean Rebuild (Nuclear Option)

```bash
# Stop and remove everything (including volumes)
docker compose down -v

# Remove old images
docker rmi comedyinsight-app 2>/dev/null || true

# Rebuild from scratch
docker compose up --build -d
```

## 🔧 First-Time MinIO Setup

After starting containers, you need to create the S3 bucket:

### Option 1: Using MinIO Console (Web UI)
1. Open http://localhost:9001
2. Login with:
   - Username: `admin`
   - Password: `change-me-secure-password`
3. Click "Create Bucket"
4. Bucket name: `comedyinsight-videos`
5. Click "Create Bucket"

### Option 2: Using MinIO Client (CLI)

```bash
# Install MinIO Client (mc) locally (if not installed)
# macOS: brew install minio/stable/mc
# Linux: wget https://dl.min.io/client/mc/release/linux-amd64/mc
# Windows: Download from https://min.io/download#/windows

# Configure alias
mc alias set local http://localhost:9000 admin change-me-secure-password

# Create bucket
mc mb local/comedyinsight-videos

# Set bucket policy (optional)
mc anonymous set download local/comedyinsight-videos
```

### Option 3: Using Docker Exec

```bash
# If MinIO client is available in container (may need to add it)
docker compose exec minio sh -c "mc alias set myminio http://localhost:9000 admin change-me-secure-password && mc mb myminio/comedyinsight-videos"
```

**Note**: The MinIO image doesn't include `mc` by default. You may need to use the web console or install `mc` locally.

## ✅ Verification Steps

After rebuilding and starting containers:

### 1. Check All Services Are Running
```bash
docker compose ps
```

You should see:
- ✅ `comedyinsight-db` (PostgreSQL)
- ✅ `comedyinsight-app` (Node.js server)
- ✅ `comedyinsight-minio` (MinIO)
- ✅ `comedyinsight-pgadmin` (pgAdmin)

### 2. Test App Health
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "database": "connected"
}
```

### 3. Test MinIO Console
Open http://localhost:9001 and verify you can login.

### 4. Test S3 Service (if bucket exists)
```bash
# Test download endpoint (requires auth token)
curl -X POST http://localhost:3000/api/downloads/request \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"video_id": "test", "quality": "720p"}'
```

## 📝 Important Notes

### Production Deployment

⚠️ **Before deploying to production:**

1. **Change MinIO password**:
   ```yaml
   MINIO_ROOT_PASSWORD: your-secure-password-here
   AWS_SECRET_ACCESS_KEY: your-secure-password-here
   ```

2. **Use AWS S3 instead of MinIO** (optional):
   ```yaml
   AWS_S3_ENDPOINT: ""  # Empty for AWS S3
   AWS_S3_REGION: us-east-1
   AWS_ACCESS_KEY_ID: your-aws-access-key
   AWS_SECRET_ACCESS_KEY: your-aws-secret-key
   AWS_S3_BUCKET: your-production-bucket
   AWS_S3_USE_PATH_STYLE: "false"
   ```

3. **Remove MinIO service** from docker-compose.yml if using AWS S3

### Dockerfile

The `Dockerfile` is already correct and includes all new files automatically:
- ✅ Copies all `server/` files (including new `s3.service.ts`)
- ✅ Installs all dependencies (including `@aws-sdk/client-s3`)
- ✅ Builds TypeScript to JavaScript

No changes needed to Dockerfile.

## 🎯 Quick Reference

### Start Everything
```bash
docker compose up --build -d
```

### View Logs
```bash
docker compose logs -f app
docker compose logs -f minio
```

### Stop Everything
```bash
docker compose down
```

### Stop and Remove Volumes
```bash
docker compose down -v
```

### Access Services
- **App**: http://localhost:3000
- **pgAdmin**: http://localhost:8080
- **MinIO Console**: http://localhost:9001
- **MinIO API**: http://localhost:9000

## ✅ Summary

- ✅ **All fixes applied to Docker**
- ✅ **Docker Compose updated with MinIO**
- ✅ **Environment variables configured**
- ✅ **Rebuild required** - Run `docker compose up --build`

The Docker setup now includes:
- ✅ PostgreSQL database
- ✅ Node.js Express server (with S3 service)
- ✅ MinIO S3-compatible storage
- ✅ pgAdmin database management

All fixes are now available in Docker! 🎉
