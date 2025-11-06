-- ============================================================================
-- ComedyInsight Analytics Queries
-- ============================================================================

-- ============================================================================
-- 1. REAL VIEWS (Authentic user views)
-- ============================================================================

-- Real views per video (unique users, IP, device)
CREATE OR REPLACE VIEW real_views_per_video AS
SELECT 
    v.id as video_id,
    v.title as video_title,
    COUNT(DISTINCT uv.id) as unique_viewers,
    COUNT(DISTINCT uv.user_id) as unique_user_views,
    COUNT(DISTINCT uv.ip_address) as unique_ip_views,
    COUNT(*) as total_real_views,
    AVG(CASE WHEN uv.user_id IS NOT NULL THEN 1 ELSE 0 END) * 100 as authenticated_view_rate
FROM views uv
JOIN videos v ON uv.video_id = v.id
WHERE uv.created_at >= CURRENT_DATE - INTERVAL '30 days'  -- Last 30 days
GROUP BY v.id, v.title
ORDER BY total_real_views DESC;

-- Real views by date
CREATE OR REPLACE VIEW real_views_trend AS
SELECT 
    DATE(created_at) as view_date,
    COUNT(*) as daily_real_views,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT ip_address) as unique_ips,
    COUNT(DISTINCT video_id) as videos_viewed
FROM views
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY view_date DESC;

-- ============================================================================
-- 2. VISIBLE VIEWS (real + fake for display)
-- ============================================================================

-- Visible views per video
CREATE OR REPLACE VIEW visible_views_per_video AS
SELECT 
    v.id as video_id,
    v.title,
    v.visible_view_count,
    COALESCE(rv.total_real_views, 0) as real_views,
    v.visible_view_count - COALESCE(rv.total_real_views, 0) as fake_views,
    CASE 
        WHEN v.visible_view_count > 0 
        THEN (v.visible_view_count - COALESCE(rv.total_real_views, 0))::DECIMAL / v.visible_view_count * 100
        ELSE 0 
    END as fake_view_percentage
FROM videos v
LEFT JOIN real_views_per_video rv ON v.id = rv.video_id
ORDER BY v.visible_view_count DESC;

-- Visible views campaign summary
CREATE OR REPLACE VIEW fake_views_campaign_summary AS
SELECT 
    fvc.id as campaign_id,
    fvc.name as campaign_name,
    fvc.video_id,
    v.title as video_title,
    fvc.target_count,
    fvc.duration_days,
    fvc.pattern,
    fvc.status,
    fvc.started_at,
    fvc.completed_at,
    COUNT(DISTINCT fvh.id) as executed_days,
    COALESCE(SUM(fvh.views_added), 0) as total_views_added
FROM fake_views_campaigns fvc
LEFT JOIN videos v ON fvc.video_id = v.id
LEFT JOIN fake_views_history fvh ON fvc.id = fvh.campaign_id
GROUP BY fvc.id, fvc.name, fvc.video_id, v.title, fvc.target_count, 
         fvc.duration_days, fvc.pattern, fvc.status, fvc.started_at, fvc.completed_at
ORDER BY fvc.created_at DESC;

-- ============================================================================
-- 3. CONVERSION RATES
-- ============================================================================

-- View -> Play -> Subscribe Funnel
CREATE OR REPLACE VIEW conversion_funnel AS
WITH video_stats AS (
    SELECT 
        v.id as video_id,
        COUNT(DISTINCT uv.id) as views,
        COUNT(DISTINCT wh.user_id) as plays,  -- watch_history entries
        COUNT(DISTINCT sub.user_id) as subscribers_from_video
    FROM videos v
    LEFT JOIN views uv ON v.id = uv.video_id
    LEFT JOIN watch_history wh ON v.id = wh.video_id
    LEFT JOIN subscriptions sub ON v.id = ANY(sub.metadata->>'video_ids'::text[]) 
        AND sub.status = 'active'
    GROUP BY v.id
)
SELECT 
    video_id,
    views,
    plays,
    subscribers_from_video,
    CASE 
        WHEN views > 0 THEN (plays::DECIMAL / views * 100)::NUMERIC(10,2)
        ELSE 0 
    END as view_to_play_rate,
    CASE 
        WHEN plays > 0 THEN (subscribers_from_video::DECIMAL / plays * 100)::NUMERIC(10,2)
        ELSE 0 
    END as play_to_subscribe_rate,
    CASE 
        WHEN views > 0 THEN (subscribers_from_video::DECIMAL / views * 100)::NUMERIC(10,2)
        ELSE 0 
    END as overall_conversion_rate
FROM video_stats
ORDER BY views DESC;

-- Overall conversion metrics
CREATE OR REPLACE VIEW overall_conversion_metrics AS
SELECT 
    'Last 7 Days' as period,
    COUNT(DISTINCT uv.user_id) as total_viewers,
    COUNT(DISTINCT wh.user_id) as total_players,
    COUNT(DISTINCT sub.user_id) as total_subscribers,
    COUNT(DISTINCT wh.user_id)::DECIMAL / NULLIF(COUNT(DISTINCT uv.user_id), 0) * 100 as view_to_play_rate,
    COUNT(DISTINCT sub.user_id)::DECIMAL / NULLIF(COUNT(DISTINCT wh.user_id), 0) * 100 as play_to_subscribe_rate
FROM views uv
FULL OUTER JOIN watch_history wh ON uv.user_id = wh.user_id AND uv.video_id = wh.video_id
FULL OUTER JOIN subscriptions sub ON sub.status = 'active' 
    AND sub.created_at >= CURRENT_DATE - INTERVAL '7 days'
WHERE uv.created_at >= CURRENT_DATE - INTERVAL '7 days'
UNION ALL
SELECT 
    'Last 30 Days',
    COUNT(DISTINCT uv.user_id),
    COUNT(DISTINCT wh.user_id),
    COUNT(DISTINCT sub.user_id),
    COUNT(DISTINCT wh.user_id)::DECIMAL / NULLIF(COUNT(DISTINCT uv.user_id), 0) * 100,
    COUNT(DISTINCT sub.user_id)::DECIMAL / NULLIF(COUNT(DISTINCT wh.user_id), 0) * 100
FROM views uv
FULL OUTER JOIN watch_history wh ON uv.user_id = wh.user_id AND uv.video_id = wh.video_id
FULL OUTER JOIN subscriptions sub ON sub.status = 'active' 
    AND sub.created_at >= CURRENT_DATE - INTERVAL '30 days'
WHERE uv.created_at >= CURRENT_DATE - INTERVAL '30 days';

-- ============================================================================
-- 4. CLICK-THROUGH RATE (CTR) ON VIDEO CARDS
-- ============================================================================

-- CTR: views per impression (assumes impression logging in events table)
-- Note: This assumes an events table for tracking impressions
-- Create events table if needed:
/*
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
*/

CREATE OR REPLACE VIEW ctr_per_video AS
WITH impressions AS (
    SELECT 
        video_id,
        COUNT(*) as total_impressions,
        COUNT(DISTINCT user_id) as unique_users_impressed
    FROM events
    WHERE event_type = 'impression'
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY video_id
),
clicks AS (
    SELECT 
        video_id,
        COUNT(*) as total_clicks,
        COUNT(DISTINCT user_id) as unique_users_clicked
    FROM events
    WHERE event_type = 'click'
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY video_id
)
SELECT 
    v.id as video_id,
    v.title,
    COALESCE(imp.total_impressions, 0) as impressions,
    COALESCE(clk.total_clicks, 0) as clicks,
    CASE 
        WHEN imp.total_impressions > 0 
        THEN (COALESCE(clk.total_clicks, 0)::DECIMAL / imp.total_impressions * 100)::NUMERIC(10,2)
        ELSE 0 
    END as ctr_percentage
FROM videos v
LEFT JOIN impressions imp ON v.id = imp.video_id
LEFT JOIN clicks clk ON v.id = clk.video_id
WHERE imp.total_impressions > 0  -- Only videos with impressions
ORDER BY ctr_percentage DESC;

-- ============================================================================
-- 5. RETENTION METRICS
-- ============================================================================

-- Day 1, 7, 30 Retention
CREATE OR REPLACE VIEW user_retention AS
WITH user_signups AS (
    SELECT 
        id as user_id,
        created_at as signup_date
    FROM users
),
day1_retained AS (
    SELECT 
        us.user_id,
        COUNT(DISTINCT DATE(wh.created_at)) >= 1 as day1_active
    FROM user_signups us
    LEFT JOIN watch_history wh ON us.user_id = wh.user_id
    WHERE wh.created_at BETWEEN us.signup_date AND us.signup_date + INTERVAL '1 day'
    GROUP BY us.user_id
),
day7_retained AS (
    SELECT 
        us.user_id,
        COUNT(DISTINCT DATE(wh.created_at)) >= 1 as day7_active
    FROM user_signups us
    LEFT JOIN watch_history wh ON us.user_id = wh.user_id
    WHERE wh.created_at BETWEEN us.signup_date AND us.signup_date + INTERVAL '7 days'
    GROUP BY us.user_id
),
day30_retained AS (
    SELECT 
        us.user_id,
        COUNT(DISTINCT DATE(wh.created_at)) >= 1 as day30_active
    FROM user_signups us
    LEFT JOIN watch_history wh ON us.user_id = wh.user_id
    WHERE wh.created_at BETWEEN us.signup_date AND us.signup_date + INTERVAL '30 days'
    GROUP BY us.user_id
)
SELECT 
    COUNT(DISTINCT us.user_id) as total_signups,
    COUNT(DISTINCT CASE WHEN d1.day1_active THEN us.user_id END) as day1_retained,
    COUNT(DISTINCT CASE WHEN d7.day7_active THEN us.user_id END) as day7_retained,
    COUNT(DISTINCT CASE WHEN d30.day30_active THEN us.user_id END) as day30_retained,
    COUNT(DISTINCT CASE WHEN d1.day1_active THEN us.user_id END)::DECIMAL / 
        NULLIF(COUNT(DISTINCT us.user_id), 0) * 100 as day1_retention_rate,
    COUNT(DISTINCT CASE WHEN d7.day7_active THEN us.user_id END)::DECIMAL / 
        NULLIF(COUNT(DISTINCT us.user_id), 0) * 100 as day7_retention_rate,
    COUNT(DISTINCT CASE WHEN d30.day30_active THEN us.user_id END)::DECIMAL / 
        NULLIF(COUNT(DISTINCT us.user_id), 0) * 100 as day30_retention_rate
FROM user_signups us
LEFT JOIN day1_retained d1 ON us.user_id = d1.user_id
LEFT JOIN day7_retained d7 ON us.user_id = d7.user_id
LEFT JOIN day30_retained d30 ON us.user_id = d30.user_id
WHERE us.signup_date >= CURRENT_DATE - INTERVAL '90 days';  -- Last 90 days

-- Cohort-based retention
CREATE OR REPLACE VIEW cohort_retention AS
WITH cohorts AS (
    SELECT 
        DATE_TRUNC('week', created_at) as cohort_week,
        id as user_id,
        created_at
    FROM users
),
retention_data AS (
    SELECT 
        c.cohort_week,
        DATE_TRUNC('week', wh.created_at) as activity_week,
        COUNT(DISTINCT c.user_id) as users_active
    FROM cohorts c
    LEFT JOIN watch_history wh ON c.user_id = wh.user_id
    WHERE c.cohort_week >= CURRENT_DATE - INTERVAL '12 weeks'
    GROUP BY c.cohort_week, DATE_TRUNC('week', wh.created_at)
)
SELECT 
    cohort_week,
    activity_week,
    users_active,
    COALESCE(users_active::DECIMAL / NULLIF(
        FIRST_VALUE(users_active) OVER (PARTITION BY cohort_week ORDER BY activity_week)
    , 0) * 100, 0)::NUMERIC(10,2) as retention_percentage
FROM retention_data
ORDER BY cohort_week DESC, activity_week;

-- ============================================================================
-- 6. DASHBOARD SUMMARY METRICS
-- ============================================================================

CREATE OR REPLACE VIEW dashboard_summary AS
SELECT 
    'users' as metric_name,
    COUNT(*) as value,
    'total' as category
FROM users
UNION ALL
SELECT 
    'videos',
    COUNT(*),
    'total'
FROM videos
UNION ALL
SELECT 
    'real_views',
    COUNT(*),
    'last_30_days'
FROM views
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT 
    'visible_views',
    SUM(visible_view_count),
    'total'
FROM videos
UNION ALL
SELECT 
    'active_subscriptions',
    COUNT(*),
    'active'
FROM subscriptions
WHERE status = 'active' AND end_date > CURRENT_TIMESTAMP
UNION ALL
SELECT 
    'conversion_rate',
    AVG(
        CASE 
            WHEN sub.id IS NOT NULL THEN 1.0
            ELSE 0.0
        END
    ) * 100,
    'last_7_days'
FROM views v
LEFT JOIN subscriptions sub ON v.user_id = sub.user_id 
    AND sub.status = 'active'
    AND sub.created_at >= CURRENT_DATE - INTERVAL '7 days'
WHERE v.created_at >= CURRENT_DATE - INTERVAL '7 days';

-- ============================================================================
-- EXAMPLE QUERIES
-- ============================================================================

-- Top 10 videos by real views
SELECT * FROM real_views_per_video LIMIT 10;

-- Conversion funnel for specific video
SELECT * FROM conversion_funnel WHERE video_id = 'VIDEO_UUID_HERE';

-- Overall retention metrics
SELECT * FROM user_retention;

-- Dashboard metrics
SELECT * FROM dashboard_summary;

-- Fake views campaign performance
SELECT * FROM fake_views_campaign_summary;

