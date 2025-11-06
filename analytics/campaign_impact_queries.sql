-- ============================================================================
-- Campaign Impact Analysis Queries
-- ============================================================================
-- Analyze impact of fake views campaigns on user behavior

-- ============================================================================
-- 1. CAMPAIGN IMPACT ON PLAYS
-- ============================================================================

-- Per-campaign impact on plays
CREATE OR REPLACE VIEW campaign_play_impact AS
WITH campaign_baseline AS (
    -- Baseline plays before campaign
    SELECT 
        fvc.video_id,
        COUNT(DISTINCT wh.user_id) as baseline_plays
    FROM fake_views_campaigns fvc
    LEFT JOIN watch_history wh ON fvc.video_id = wh.video_id
        AND wh.created_at < fvc.started_at
    GROUP BY fvc.video_id
),
campaign_during AS (
    -- Plays during campaign
    SELECT 
        fvc.id as campaign_id,
        fvc.video_id,
        COUNT(DISTINCT wh.user_id) as during_plays
    FROM fake_views_campaigns fvc
    LEFT JOIN watch_history wh ON fvc.video_id = wh.video_id
        AND wh.created_at >= fvc.started_at
        AND wh.created_at <= COALESCE(fvc.completed_at, CURRENT_TIMESTAMP)
    GROUP BY fvc.id, fvc.video_id
),
campaign_after AS (
    -- Plays after campaign
    SELECT 
        fvc.id as campaign_id,
        fvc.video_id,
        COUNT(DISTINCT wh.user_id) as after_plays
    FROM fake_views_campaigns fvc
    LEFT JOIN watch_history wh ON fvc.video_id = wh.video_id
        AND wh.created_at > COALESCE(fvc.completed_at, CURRENT_TIMESTAMP)
    WHERE fvc.completed_at IS NOT NULL
    GROUP BY fvc.id, fvc.video_id
)
SELECT 
    fvc.id as campaign_id,
    fvc.name as campaign_name,
    v.title as video_title,
    fvc.target_count,
    cb.baseline_plays,
    cd.during_plays,
    ca.after_plays,
    (cd.during_plays - cb.baseline_plays) as play_delta_during,
    CASE 
        WHEN cb.baseline_plays > 0 
        THEN ((cd.during_plays - cb.baseline_plays)::DECIMAL / cb.baseline_plays * 100)::NUMERIC(10,2)
        ELSE NULL
    END as play_delta_percentage_during,
    (ca.after_plays - cd.during_plays) as play_delta_after,
    CASE 
        WHEN cd.during_plays > 0 
        THEN ((ca.after_plays - cd.during_plays)::DECIMAL / cd.during_plays * 100)::NUMERIC(10,2)
        ELSE NULL
    END as play_delta_percentage_after
FROM fake_views_campaigns fvc
LEFT JOIN videos v ON fvc.video_id = v.id
LEFT JOIN campaign_baseline cb ON fvc.video_id = cb.video_id
LEFT JOIN campaign_during cd ON fvc.id = cd.campaign_id
LEFT JOIN campaign_after ca ON fvc.id = ca.campaign_id
ORDER BY fvc.created_at DESC;

-- ============================================================================
-- 2. CAMPAIGN IMPACT ON SUBSCRIPTIONS
-- ============================================================================

-- Per-campaign impact on subscriptions
CREATE OR REPLACE VIEW campaign_subscription_impact AS
WITH campaign_video_watches AS (
    -- Users who watched campaign video
    SELECT DISTINCT
        fvc.id as campaign_id,
        wh.user_id,
        MIN(wh.created_at) as first_watch_at
    FROM fake_views_campaigns fvc
    JOIN watch_history wh ON fvc.video_id = wh.video_id
        AND wh.created_at >= fvc.started_at
        AND wh.created_at <= COALESCE(fvc.completed_at, CURRENT_TIMESTAMP)
    GROUP BY fvc.id, wh.user_id
),
campaign_conversions AS (
    -- Users who subscribed after watching campaign video
    SELECT 
        cvw.campaign_id,
        COUNT(DISTINCT CASE 
            WHEN sub.created_at >= cvw.first_watch_at 
                AND sub.status = 'active'
            THEN sub.user_id 
        END) as subscriptions_from_campaign
    FROM campaign_video_watches cvw
    LEFT JOIN subscriptions sub ON cvw.user_id = sub.user_id
    GROUP BY cvw.campaign_id
)
SELECT 
    fvc.id as campaign_id,
    fvc.name as campaign_name,
    v.title as video_title,
    fvc.target_count as fake_views_added,
    cc.subscriptions_from_campaign,
    COUNT(DISTINCT cvw.user_id) as users_who_watched,
    CASE 
        WHEN COUNT(DISTINCT cvw.user_id) > 0 
        THEN (cc.subscriptions_from_campaign::DECIMAL / 
              COUNT(DISTINCT cvw.user_id) * 100)::NUMERIC(10,2)
        ELSE 0
    END as conversion_rate
FROM fake_views_campaigns fvc
JOIN videos v ON fvc.video_id = v.id
LEFT JOIN campaign_video_watches cvw ON fvc.id = cvw.campaign_id
LEFT JOIN campaign_conversions cc ON fvc.id = cc.campaign_id
GROUP BY fvc.id, fvc.name, v.title, fvc.target_count, cc.subscriptions_from_campaign
ORDER BY fvc.created_at DESC;

-- ============================================================================
-- 3. VIDEO PERFORMANCE COMPARISON
-- ============================================================================

-- Compare boosted vs non-boosted videos
CREATE OR REPLACE VIEW boosted_vs_non_boosted_performance AS
WITH boosted_videos AS (
    SELECT 
        fvc.video_id,
        SUM(fvc.target_count) as total_fake_views
    FROM fake_views_campaigns fvc
    WHERE fvc.status = 'completed'
    GROUP BY fvc.video_id
),
video_performance AS (
    SELECT 
        v.id as video_id,
        v.title,
        v.visible_view_count,
        COUNT(DISTINCT uv.id) as real_views,
        COUNT(DISTINCT wh.user_id) as plays,
        COUNT(DISTINCT CASE 
            WHEN wh.watched_seconds >= 30 
            THEN wh.user_id 
        END) as meaningful_plays,
        COUNT(DISTINCT sub.user_id) as subscribers
    FROM videos v
    LEFT JOIN views uv ON v.id = uv.video_id
    LEFT JOIN watch_history wh ON v.id = wh.video_id
    LEFT JOIN subscriptions sub ON sub.status = 'active'
    GROUP BY v.id, v.title, v.visible_view_count
)
SELECT 
    vp.video_id,
    vp.title,
    CASE 
        WHEN bv.video_id IS NOT NULL THEN 'boosted'
        ELSE 'non_boosted'
    END as campaign_type,
    COALESCE(bv.total_fake_views, 0) as fake_views_added,
    vp.real_views,
    vp.plays,
    vp.meaningful_plays,
    vp.subscribers,
    CASE 
        WHEN vp.real_views > 0 
        THEN (vp.plays::DECIMAL / vp.real_views * 100)::NUMERIC(10,2)
        ELSE 0
    END as view_to_play_rate,
    CASE 
        WHEN vp.plays > 0 
        THEN (vp.subscribers::DECIMAL / vp.plays * 100)::NUMERIC(10,2)
        ELSE 0
    END as play_to_subscribe_rate
FROM video_performance vp
LEFT JOIN boosted_videos bv ON vp.video_id = bv.video_id
ORDER BY vp.plays DESC;

-- ============================================================================
-- 4. ROI ANALYSIS
-- ============================================================================

-- Return on Investment for fake views campaigns
CREATE OR REPLACE VIEW campaign_roi AS
WITH campaign_costs AS (
    SELECT 
        fvc.id as campaign_id,
        SUM(fvc.target_count) as fake_views,
        -- Assume cost per view (adjust as needed)
        0.001 as cost_per_view,
        SUM(fvc.target_count) * 0.001 as total_cost
    FROM fake_views_campaigns fvc
    GROUP BY fvc.id
),
campaign_revenue AS (
    SELECT 
        fvc.id as campaign_id,
        COUNT(DISTINCT sub.id) as subscriptions,
        -- Assume revenue per subscription (adjust as needed)
        9.99 as revenue_per_subscription,
        COUNT(DISTINCT sub.id) * 9.99 as total_revenue
    FROM fake_views_campaigns fvc
    JOIN watch_history wh ON fvc.video_id = wh.video_id
        AND wh.created_at >= fvc.started_at
    JOIN subscriptions sub ON wh.user_id = sub.user_id
        AND sub.created_at >= wh.created_at
        AND sub.status = 'active'
    GROUP BY fvc.id
)
SELECT 
    fvc.id as campaign_id,
    fvc.name,
    v.title as video_title,
    cc.fake_views,
    cc.total_cost,
    COALESCE(cr.subscriptions, 0) as subscriptions,
    COALESCE(cr.total_revenue, 0) as total_revenue,
    COALESCE(cr.total_revenue, 0) - cc.total_cost as net_profit,
    CASE 
        WHEN cc.total_cost > 0 
        THEN ((COALESCE(cr.total_revenue, 0) - cc.total_cost) / cc.total_cost * 100)::NUMERIC(10,2)
        ELSE NULL
    END as roi_percentage
FROM fake_views_campaigns fvc
JOIN videos v ON fvc.video_id = v.id
LEFT JOIN campaign_costs cc ON fvc.id = cc.campaign_id
LEFT JOIN campaign_revenue cr ON fvc.id = cr.campaign_id
ORDER BY fvc.created_at DESC;

-- ============================================================================
-- 5. VIEW DISTRIBUTION ANALYSIS
-- ============================================================================

-- Analyze view distribution patterns
CREATE OR REPLACE VIEW view_distribution_analysis AS
WITH fake_views_by_campaign AS (
    SELECT 
        fvc.video_id,
        fvc.pattern,
        SUM(CASE WHEN fvh.views_added IS NOT NULL THEN fvh.views_added ELSE 0 END) as total_added
    FROM fake_views_campaigns fvc
    LEFT JOIN fake_views_history fvh ON fvc.id = fvh.campaign_id
    GROUP BY fvc.video_id, fvc.pattern
),
real_views_by_period AS (
    SELECT 
        v.id as video_id,
        COUNT(*) FILTER (WHERE uv.created_at >= CURRENT_DATE - INTERVAL '7 days') as views_last_7d,
        COUNT(*) FILTER (WHERE uv.created_at >= CURRENT_DATE - INTERVAL '30 days') as views_last_30d,
        COUNT(*) FILTER (WHERE uv.created_at >= CURRENT_DATE - INTERVAL '90 days') as views_last_90d
    FROM videos v
    LEFT JOIN views uv ON v.id = uv.video_id
    GROUP BY v.id
)
SELECT 
    v.id as video_id,
    v.title,
    v.visible_view_count,
    rv.views_last_7d as real_views_7d,
    rv.views_last_30d as real_views_30d,
    rv.views_last_90d as real_views_90d,
    fvb.total_added as fake_views_added,
    v.visible_view_count - COALESCE(rv.views_last_90d, 0) as fake_views_current,
    CASE 
        WHEN v.visible_view_count > 0 
        THEN ((v.visible_view_count - COALESCE(rv.views_last_90d, 0))::DECIMAL / 
              v.visible_view_count * 100)::NUMERIC(10,2)
        ELSE 0
    END as fake_percentage
FROM videos v
LEFT JOIN real_views_by_period rv ON v.id = rv.video_id
LEFT JOIN fake_views_by_campaign fvb ON v.id = fvb.video_id
ORDER BY v.visible_view_count DESC;

-- ============================================================================
-- 6. TIME SERIES ANALYSIS
-- ============================================================================

-- Daily view trends with fake views
CREATE OR REPLACE VIEW daily_view_trends AS
SELECT 
    DATE(wh.created_at) as date,
    COUNT(DISTINCT wh.video_id) as videos_watched,
    COUNT(DISTINCT wh.user_id) as unique_viewers,
    COUNT(*) as total_plays,
    SUM(wh.watched_seconds) as total_watch_time,
    AVG(wh.watched_seconds) as avg_watch_time
FROM watch_history wh
WHERE wh.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(wh.created_at)
UNION ALL
SELECT 
    DATE(fvh.execution_date),
    COUNT(DISTINCT fvc.video_id),
    NULL::BIGINT,
    SUM(fvh.views_added)::BIGINT,
    NULL::INTEGER,
    NULL::NUMERIC
FROM fake_views_history fvh
JOIN fake_views_campaigns fvc ON fvh.campaign_id = fvc.id
GROUP BY DATE(fvh.execution_date)
ORDER BY date DESC;

-- ============================================================================
-- EXAMPLE QUERIES
-- ============================================================================

-- Campaign play impact
SELECT * FROM campaign_play_impact 
WHERE campaign_id = 'CAMPAIGN_UUID_HERE';

-- Top performing campaigns
SELECT 
    campaign_name,
    fake_views_added,
    users_who_watched,
    subscriptions_from_campaign,
    conversion_rate
FROM campaign_subscription_impact
ORDER BY subscriptions_from_campaign DESC
LIMIT 10;

-- ROI analysis
SELECT * FROM campaign_roi WHERE net_profit > 0;

-- Boosted vs non-boosted comparison
SELECT 
    campaign_type,
    COUNT(*) as video_count,
    AVG(real_views) as avg_real_views,
    AVG(plays) as avg_plays,
    AVG(view_to_play_rate) as avg_conversion_rate
FROM boosted_vs_non_boosted_performance
GROUP BY campaign_type;

