# Analytics & Data Engineering Guide

Complete analytics implementation for ComedyInsight including A/B testing, metrics, and campaign analysis.

## 📊 Table of Contents

1. [Metrics Overview](#metrics-overview)
2. [A/B Testing](#ab-testing)
3. [Campaign Impact Analysis](#campaign-impact-analysis)
4. [Dashboard Queries](#dashboard-queries)
5. [Implementation Guide](#implementation-guide)

## 📊 Metrics Overview

### Real Views
Authentic user interactions tracked by:
- Unique viewers (distinct users)
- Unique IPs
- Unique devices
- Time-based filtering

### Visible Views
Total views displayed to users:
```
Visible Views = Real Views + Fake Views
```

### Conversion Rates
Track user journey through funnel:
- View → Play
- Play → Subscribe
- Overall conversion

### CTR (Click-Through Rate)
Measure engagement on video cards:
```
CTR = (Clicks / Impressions) × 100
```

### Retention
User return rates:
- Day 1 retention
- Day 7 retention
- Day 30 retention
- Cohort-based retention

## 🧪 A/B Testing

### Overview

Test impact of fake views on user behavior through controlled experiments.

### Architecture

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       v
┌─────────────────────┐
│ Experiment Assignment │
│ (Hash-based)         │
└──────┬──────────────┘
       │
       ├─► Control (no boost)
       └─► Treatment (boosted views)
       │
       v
┌─────────────┐
│  Metrics    │
│  Tracking   │
└─────────────┘
```

### Setup

```sql
-- 1. Run A/B testing schema
psql -U comedyinsight -d comedyinsight -f analytics/ab_testing_schema.sql

-- 2. Create experiment
INSERT INTO experiments (name, description, status, variants)
VALUES (
    'boosted_view_count',
    'Test impact of boosted visible view counts',
    'active',
    '["control", "treatment"]'::jsonb
);
```

### Assignment Logic

```sql
-- Assign user to experiment variant
SELECT assign_to_experiment(
    'USER_UUID',
    'boosted_view_count',
    100  -- traffic %
);

-- Returns: 'control' or 'treatment'
```

**Consistent Hashing:**
- Same user always gets same variant
- Hash: `user_id + experiment_name`
- Prevents bucketing issues

### Tracking Metrics

```sql
-- Record views
SELECT record_experiment_metric(
    'USER_UUID',
    'boosted_view_count',
    'view'
);

-- Record plays
SELECT record_experiment_metric(
    'USER_UUID',
    'boosted_view_count',
    'play'
);

-- Record subscriptions
SELECT record_experiment_metric(
    'USER_UUID',
    'boosted_view_count',
    'subscribe'
);
```

### Analysis

```sql
-- View results
SELECT * FROM experiment_results 
WHERE experiment_name = 'boosted_view_count';

-- Check significance
SELECT * FROM experiment_significance 
WHERE experiment_name = 'boosted_view_count';
```

**Sample Output:**
```
experiment_name    | variant   | users | plays | conversion_rate
-------------------+-----------+-------+-------+----------------
boosted_view_count | control   | 1000  | 150   | 15.00%
boosted_view_count | treatment | 1000  | 200   | 20.00%
```

**Interpretation:**
- Lift: +5%
- Relative lift: +33.3%
- Statistical test recommended

## 📈 Campaign Impact Analysis

### Overview

Analyze ROI and effectiveness of fake views campaigns.

### Metrics Tracked

1. **Play Impact**
   - Baseline plays (before campaign)
   - During campaign plays
   - After campaign plays
   - Delta calculations

2. **Subscription Impact**
   - Users who watched campaign video
   - Subscriptions from campaign
   - Conversion rate

3. **ROI Analysis**
   - Campaign cost
   - Revenue generated
   - Net profit
   - ROI percentage

### Queries

```sql
-- Campaign play impact
SELECT * FROM campaign_play_impact 
WHERE campaign_id = 'CAMPAIGN_UUID';

-- Subscription conversion
SELECT * FROM campaign_subscription_impact 
ORDER BY subscriptions_from_campaign DESC;

-- ROI analysis
SELECT * FROM campaign_roi 
WHERE net_profit > 0;
```

### Example Output

**Campaign ROI:**
```
campaign_id | fake_views | cost  | subscriptions | revenue | roi
------------+------------+-------+---------------+---------------+------
campaign-1  | 100000     | 100   | 50            | 499.50  | 399.50%
campaign-2  | 50000      | 50    | 15            | 149.85  | 199.70%
```

## 📊 Dashboard Queries

### Pre-built Views

Run all analytics queries:
```bash
psql -U comedyinsight -d comedyinsight -f analytics/query_metrics.sql
```

### Quick Metrics

```sql
-- Top 10 videos by real views
SELECT * FROM real_views_per_video LIMIT 10;

-- Overall conversion funnel
SELECT * FROM overall_conversion_metrics;

-- User retention
SELECT * FROM user_retention;

-- Dashboard summary
SELECT * FROM dashboard_summary;
```

### Custom Queries

```sql
-- Video performance by category
SELECT 
    cat.name as category,
    AVG(vvp.total_real_views) as avg_real_views,
    AVG(cf.view_to_play_rate) as avg_play_rate,
    AVG(cf.overall_conversion_rate) as avg_conversion
FROM real_views_per_video vvp
JOIN video_categories vc ON vvp.video_id = vc.video_id
JOIN categories cat ON vc.category_id = cat.id
JOIN conversion_funnel cf ON vvp.video_id = cf.video_id
GROUP BY cat.name
ORDER BY avg_real_views DESC;

-- Trending videos (last 7 days)
SELECT 
    v.id,
    v.title,
    COUNT(DISTINCT wh.user_id) as plays_last_7d,
    AVG(wh.watched_seconds) as avg_watch_time
FROM videos v
JOIN watch_history wh ON v.id = wh.video_id
WHERE wh.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY v.id, v.title
ORDER BY plays_last_7d DESC
LIMIT 20;

-- Subscriber cohort analysis
SELECT 
    DATE_TRUNC('month', u.created_at) as signup_month,
    COUNT(DISTINCT u.id) as signups,
    COUNT(DISTINCT sub.id) as active_subscribers,
    COUNT(DISTINCT sub.id)::DECIMAL / 
        COUNT(DISTINCT u.id) * 100 as conversion_rate
FROM users u
LEFT JOIN subscriptions sub ON u.id = sub.user_id 
    AND sub.status = 'active'
GROUP BY DATE_TRUNC('month', u.created_at)
ORDER BY signup_month DESC;
```

## 🚀 Implementation Guide

### Step 1: Setup Database

```bash
# Run all schemas
cd analytics

psql -U comedyinsight -d comedyinsight -f ab_testing_schema.sql
psql -U comedyinsight -d comedyinsight -f query_metrics.sql
psql -U comedyinsight -d comedyinsight -f campaign_impact_queries.sql
```

### Step 2: Create Events Table (for CTR tracking)

```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,  -- 'impression', 'click', 'play', 'subscribe'
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_type_video ON events(event_type, video_id);
CREATE INDEX idx_events_user ON events(user_id);
CREATE INDEX idx_events_created ON events(created_at);
```

### Step 3: Integrate with Backend

**Track Impressions:**
```typescript
// In video listing
await db.query(
  'INSERT INTO events (user_id, event_type, video_id) VALUES ($1, $2, $3)',
  [userId, 'impression', videoId]
);
```

**Track Clicks:**
```typescript
// On video card click
await db.query(
  'INSERT INTO events (user_id, event_type, video_id) VALUES ($1, $2, $3)',
  [userId, 'click', videoId]
);
```

**Track Experiment Metrics:**
```typescript
// After assigning to experiment
const variant = await db.query(
  'SELECT assign_to_experiment($1, $2, 100)',
  [userId, 'boosted_view_count']
);

// Record metrics
await db.query(
  'SELECT record_experiment_metric($1, $2, $3)',
  [userId, 'boosted_view_count', 'play']
);
```

### Step 4: Dashboard Integration

**React Dashboard Example:**
```typescript
// Fetch dashboard metrics
const fetchMetrics = async () => {
  const response = await fetch('/api/analytics/dashboard');
  return response.json();
};

// Fetch conversion funnel
const fetchFunnel = async (videoId?: string) => {
  const url = videoId 
    ? `/api/analytics/funnel?video_id=${videoId}`
    : '/api/analytics/funnel';
  const response = await fetch(url);
  return response.json();
};

// Fetch A/B test results
const fetchExperimentResults = async (experimentName: string) => {
  const response = await fetch(
    `/api/analytics/experiments/${experimentName}/results`
  );
  return response.json();
};
```

### Step 5: Scheduled Reports

**Daily Summary:**
```bash
# Add to cron
0 9 * * * psql -U comedyinsight -d comedyinsight -c "
SELECT 
    'Daily Summary: ' || CURRENT_DATE as report,
    COUNT(DISTINCT user_id) as active_users,
    COUNT(*) as views,
    COUNT(DISTINCT video_id) as videos_viewed
FROM views 
WHERE created_at >= CURRENT_DATE - INTERVAL '1 day';
"
```

**Weekly Analytics Export:**
```bash
# Export to CSV
0 0 * * 1 psql -U comedyinsight -d comedyinsight -c "
COPY (
    SELECT * FROM dashboard_summary
) TO '/var/exports/weekly_summary.csv' CSV HEADER;
"
```

## 📊 Sample Dashboards

### 1. Executive Dashboard

**Metrics:**
- Total users
- Active subscriptions
- Revenue (last 30 days)
- Top 10 videos
- Conversion funnel

**Queries:**
```sql
SELECT * FROM dashboard_summary;
SELECT * FROM overall_conversion_metrics;
SELECT * FROM campaign_roi ORDER BY roi_percentage DESC LIMIT 10;
```

### 2. Campaign Dashboard

**Metrics:**
- Active campaigns
- Campaign ROI
- Play impact
- Subscription impact

**Queries:**
```sql
SELECT * FROM campaign_play_impact;
SELECT * FROM campaign_subscription_impact;
SELECT * FROM campaign_roi;
```

### 3. A/B Testing Dashboard

**Metrics:**
- Active experiments
- Variant performance
- Statistical significance
- Lift metrics

**Queries:**
```sql
SELECT * FROM experiment_results;
SELECT * FROM experiment_significance;
```

## 🔍 Advanced Analytics

### Cohort Analysis

```sql
-- Retention by signup month
SELECT 
    DATE_TRUNC('month', u.created_at) as cohort,
    COUNT(DISTINCT u.id) as signups,
    COUNT(DISTINCT CASE WHEN wh.created_at >= u.created_at + INTERVAL '1 day' 
        AND wh.created_at < u.created_at + INTERVAL '7 days' 
        THEN wh.user_id END) as day1_active,
    COUNT(DISTINCT CASE WHEN wh.created_at >= u.created_at + INTERVAL '7 days' 
        AND wh.created_at < u.created_at + INTERVAL '30 days' 
        THEN wh.user_id END) as day7_active
FROM users u
LEFT JOIN watch_history wh ON u.id = wh.user_id
GROUP BY DATE_TRUNC('month', u.created_at)
ORDER BY cohort DESC;
```

### Predictive Analytics

```sql
-- Probability of subscription based on view count
WITH video_stats AS (
    SELECT 
        v.id,
        COUNT(DISTINCT uv.user_id) as viewers,
        COUNT(DISTINCT sub.user_id) as subscribers
    FROM videos v
    LEFT JOIN views uv ON v.id = uv.video_id
    LEFT JOIN subscriptions sub ON v.id = ANY(sub.metadata->'video_ids'::text[])
    GROUP BY v.id
)
SELECT 
    NTILE(4) OVER (ORDER BY viewers) as quartile,
    AVG(viewers) as avg_viewers,
    AVG(subscribers) as avg_subscribers,
    AVG(subscribers)::DECIMAL / NULLIF(AVG(viewers), 0) * 100 as conversion_rate
FROM video_stats
GROUP BY NTILE(4) OVER (ORDER BY viewers);
```

## 📝 Best Practices

1. **Index Everything**: All columns in WHERE, JOIN, ORDER BY
2. **Partition by Date**: Large tables should be partitioned
3. **Materialized Views**: For complex queries updated hourly
4. **Retention Policies**: Archive old data after 1 year
5. **Backup Analytics**: Separate backup for analytics database

## 🔐 Security & Privacy

- Anonymize IPs after 90 days
- GDPR compliance for user data
- Rate limit analytics queries
- Audit log all data exports
- Encrypt sensitive metrics

## 📚 References

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- A/B Testing Best Practices: https://www.khanacademy.org/test-prep/praxis-math/praxis-math-lessons/gtp--praxis-math--lessons--statistics-and-probability/a/gtp--praxis-math--article--hypothesis-testing-strategies
- Analytics Dashboard Design: https://www.toptal.com/designers/dashboard/analytics-dashboard-design

