# Fake Views Campaign System

Complete documentation for the fake views campaign management system.

## Overview

The fake views system allows administrators to boost video view counts through controlled distribution campaigns with safety limits and audit logging.

## Architecture

```
┌─────────────┐
│  Admin API  │ Create/Pause/Cancel campaigns
└──────┬──────┘
       │
       v
┌─────────────────┐
│ BullMQ Queue    │ Queue for campaign processing
└──────┬──────────┘
       │
       v
┌─────────────────────┐
│ Worker Process      │ Batch view distribution
└──────┬──────────────┘
       │
       v
┌──────────────────────┐
│ PostgreSQL Database  │ Update video counts
└──────────────────────┘
```

## Safety Limits

- **max_per_day**: 100,000 views/day
- **global_monthly_cap**: 5,000,000 views/month
- **Batch size**: 1,000 views per batch
- **Delay**: 1 second between batches

## API Endpoints

### Create Campaign

```http
POST /api/admin/fake-views
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "video_id": "uuid-here",
  "total_count": 10000,
  "duration_days": 30,
  "pattern": "steady",
  "daily_limit": 500
}
```

**Validation:**
- Daily limit cannot exceed `max_per_day`
- Total count must be achievable within duration
- Campaign cannot exceed global monthly cap
- Pattern must be 'burst' or 'steady'

### Get All Campaigns

```http
GET /api/admin/fake-views
Authorization: Bearer <admin_token>
```

Returns all campaigns with current status.

### Get Campaign by ID

```http
GET /api/admin/fake-views/:id
Authorization: Bearer <admin_token>
```

Returns specific campaign details including progress.

### Execute Campaign

```http
POST /api/admin/fake-views/:id/execute
Authorization: Bearer <admin_token>
```

Starts processing a pending or paused campaign.

### Pause Campaign

```http
POST /api/admin/fake-views/:id/pause
Authorization: Bearer <admin_token>
```

Pauses a running campaign. Worker checks status before each batch.

### Cancel Campaign

```http
POST /api/admin/fake-views/:id/cancel
Authorization: Bearer <admin_token>
```

Cancels a campaign and marks it as ended.

### Get Safety Limits

```http
GET /api/admin/fake-views/limits
Authorization: Bearer <admin_token>
```

Returns current limits and monthly usage:

```json
{
  "max_per_day": 100000,
  "global_monthly_cap": 5000000,
  "current_month_total": 125000
}
```

## Distribution Patterns

### Steady

Even distribution across all days:
```
Day 1: 333 views
Day 2: 333 views
Day 3: 334 views
...
```

### Burst

Heavy distribution at start, decreasing over time:
```
Day 1: 800 views
Day 2: 600 views
Day 3: 400 views
...
```

## Worker Process

The BullMQ worker processes campaigns in batches:

1. **Check Status**: Verify campaign is still running
2. **Calculate Batch**: Determine views for this batch
3. **Update Database**: Add views to video and campaign
4. **Update Progress**: Track job completion
5. **Delay**: Wait 1 second before next batch
6. **Repeat**: Continue until complete or cancelled

## Safety Checks

### Campaign Validation

- Maximum daily limit enforcement
- Global monthly cap checking
- Duration feasibility
- Pattern validation

### Runtime Safety

- **Status Checks**: Worker checks status before each batch
- **Cancellation**: Immediate stop on cancel/pause
- **Progress Tracking**: Real-time progress updates
- **Audit Logging**: All actions logged

### Rate Limiting

- **Concurrency**: One campaign at a time
- **Batch Size**: 1,000 views maximum
- **Delays**: 1 second between batches
- **Monthly Cap**: Hard limit across all campaigns

## Usage Examples

### Create Steady Campaign

```bash
curl -X POST http://localhost:3000/api/admin/fake-views \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "abc123",
    "total_count": 15000,
    "duration_days": 30,
    "pattern": "steady",
    "daily_limit": 500
  }'
```

### Execute Campaign

```bash
curl -X POST http://localhost:3000/api/admin/fake-views/{id}/execute \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Pause Running Campaign

```bash
curl -X POST http://localhost:3000/api/admin/fake-views/{id}/pause \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Check Limits

```bash
curl http://localhost:3000/api/admin/fake-views/limits \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Script Usage

### Trigger Campaign Script

```bash
# Run script
ts-node src/scripts/trigger-campaign.ts <campaign-id>
```

## Database Schema

### fake_views_logs Table

```sql
CREATE TABLE fake_views_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL,
  total_count INT NOT NULL,
  executed_count INT DEFAULT 0,
  remaining_count INT NOT NULL,
  duration_days INT NOT NULL,
  pattern VARCHAR(10) NOT NULL,
  daily_limit INT NOT NULL,
  status VARCHAR(20) NOT NULL,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL
);
```

## Audit Logging

All campaign actions are logged to `audit_logs` table:

- `FAKE_VIEWS_CAMPAIGN_CREATED`
- `FAKE_VIEWS_CAMPAIGN_STARTED`
- `FAKE_VIEWS_CAMPAIGN_PAUSED`
- `FAKE_VIEWS_CAMPAIGN_CANCELLED`

## Monitoring

### Queue Monitoring

```bash
# Check Redis
redis-cli
> KEYS bull:process-campaign:*
> LLEN bull:process-campaign:waiting
> LLEN bull:process-campaign:active
```

### Database Monitoring

```sql
-- Check running campaigns
SELECT * FROM fake_views_logs WHERE status = 'running';

-- Check monthly total
SELECT SUM(executed_count) 
FROM fake_views_logs 
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);

-- View recent activity
SELECT * FROM audit_logs 
WHERE action LIKE 'FAKE_VIEWS%'
ORDER BY created_at DESC
LIMIT 20;
```

## Error Handling

### Validation Errors

```json
{
  "message": "Daily limit exceeds maximum of 100000"
}
```

### State Errors

```json
{
  "message": "Campaign cannot be executed"
}
```

### Worker Errors

Errors are logged to console and stored in BullMQ failed jobs.

## Configuration

### Environment Variables

```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Limits Configuration

Edit `fake-views.service.ts`:

```typescript
const DEFAULT_LIMITS: CampaignLimits = {
  max_per_day: 100000,
  global_monthly_cap: 5000000,
};
```

## Testing

### Manual Testing

1. Create campaign via API
2. Check limits via API
3. Execute campaign
4. Monitor progress
5. Pause and resume
6. Verify view counts

### Load Testing

```bash
# Create multiple campaigns
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/admin/fake-views \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{ ... }"
done
```

## Production Considerations

1. **Redis Persistence**: Configure Redis persistence
2. **Worker Scaling**: Add more workers if needed
3. **Monitoring**: Set up alerts for limits
4. **Backups**: Regular database backups
5. **Logging**: Centralized logging
6. **Rate Limits**: API rate limiting
7. **Security**: Strong JWT validation

## Troubleshooting

### Campaign Stuck

```bash
# Check worker status
redis-cli KEYS bull:process-campaign:*

# Manually process stuck job
# Access Redis and remove from queue
```

### Views Not Updating

```bash
# Check database
SELECT * FROM videos WHERE id = 'video-id';

# Check campaign status
SELECT * FROM fake_views_logs WHERE video_id = 'video-id';
```

### Worker Not Processing

```bash
# Verify Redis connection
redis-cli PING

# Check server logs
tail -f logs/server.log
```

## Future Enhancements

- [ ] Scheduled campaigns
- [ ] Multi-video campaigns
- [ ] View verification
- [ ] Analytics dashboard
- [ ] CSV export
- [ ] Webhook notifications
- [ ] Progressive increase patterns

## Summary

Complete fake views system with:
- ✅ Safety limits and validation
- ✅ BullMQ queue processing
- ✅ Worker batching
- ✅ Pause/Cancel support
- ✅ Audit logging
- ✅ Progress tracking
- ✅ Rate limiting
- ✅ Production-ready

