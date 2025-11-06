# Fake Views Campaign System - Usage Guide

Quick reference for using the fake views campaign system.

## Setup

### 1. Install Dependencies

```bash
cd server
yarn install
```

### 2. Run Database Migration

```bash
psql -U postgres -d comedyinsight -f migrations/002_add_fake_views_campaigns.sql
```

### 3. Start Redis

```bash
# Mac
brew services start redis

# Docker
docker run -d -p 6379:6379 redis:7-alpine

# Linux
sudo systemctl start redis
```

### 4. Configure Environment

Add to `server/.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

## API Usage

### Create Campaign

```bash
curl -X POST http://localhost:3000/api/admin/fake-views \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "abc-123-video-id",
    "total_count": 10000,
    "duration_days": 30,
    "pattern": "steady",
    "daily_limit": 500
  }'
```

### Execute Campaign

```bash
curl -X POST http://localhost:3000/api/admin/fake-views/{campaign-id}/execute \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Pause Campaign

```bash
curl -X POST http://localhost:3000/api/admin/fake-views/{campaign-id}/pause \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Cancel Campaign

```bash
curl -X POST http://localhost:3000/api/admin/fake-views/{campaign-id}/cancel \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Get Campaign Status

```bash
curl http://localhost:3000/api/admin/fake-views/{campaign-id} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Check Limits

```bash
curl http://localhost:3000/api/admin/fake-views/limits \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Monitoring

### Worker Logs

```bash
# Check server logs
tail -f logs/server.log

# Look for worker messages
grep "Processing campaign" logs/server.log
```

### Redis Queue

```bash
redis-cli
> KEYS bull:*
> LLEN bull:process-campaign:waiting
> LLEN bull:process-campaign:active
```

### Database

```sql
-- Check running campaigns
SELECT * FROM fake_views_logs WHERE status = 'running';

-- Check monthly usage
SELECT SUM(executed_count) 
FROM fake_views_logs 
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);

-- Audit logs
SELECT * FROM audit_logs 
WHERE action LIKE 'FAKE_VIEWS%'
ORDER BY created_at DESC;
```

## Safety Checks

All implemented:

✅ **Daily Limit**: Max 100,000 views/day  
✅ **Monthly Cap**: Max 5,000,000 views/month  
✅ **Batch Processing**: 1,000 views per batch  
✅ **Status Checking**: Worker checks before each batch  
✅ **Audit Logging**: All actions logged  
✅ **Admin Only**: JWT authentication required  

## Examples

### Steady Distribution

```json
{
  "video_id": "video-123",
  "total_count": 15000,
  "duration_days": 30,
  "pattern": "steady",
  "daily_limit": 500
}
```

Result: ~500 views per day

### Burst Distribution

```json
{
  "video_id": "video-456",
  "total_count": 10000,
  "duration_days": 7,
  "pattern": "burst",
  "daily_limit": 2000
}
```

Result: High at start, decreasing over time

## Error Handling

Common errors:

- **Validation**: Check field types and ranges
- **Limits**: Daily or monthly cap exceeded
- **Status**: Campaign not in valid state
- **Auth**: Invalid or missing JWT token

