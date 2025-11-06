-- Migration: Add ad tracking tables
-- Description: Track ad impressions and clicks for analytics

-- Ad impressions table
CREATE TABLE IF NOT EXISTS ad_impressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    device_type VARCHAR(50),
    platform VARCHAR(50),
    ip_address INET,
    country_code VARCHAR(2),
    city VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ad clicks table
CREATE TABLE IF NOT EXISTS ad_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    device_type VARCHAR(50),
    platform VARCHAR(50),
    ip_address INET,
    country_code VARCHAR(2),
    city VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for ad_impressions
CREATE INDEX IF NOT EXISTS idx_ad_impressions_ad_id ON ad_impressions(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_user_id ON ad_impressions(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_created_at ON ad_impressions(created_at);

-- Indexes for ad_clicks
CREATE INDEX IF NOT EXISTS idx_ad_clicks_ad_id ON ad_clicks(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_user_id ON ad_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_created_at ON ad_clicks(created_at);

-- Add comments
COMMENT ON TABLE ad_impressions IS 'Track ad impressions for analytics';
COMMENT ON TABLE ad_clicks IS 'Track ad clicks for analytics';

-- ============================================================================
-- ROLLBACK SECTION
-- ============================================================================

/*
-- ROLLBACK: Drop tables and indexes

DROP INDEX IF EXISTS idx_ad_clicks_created_at;
DROP INDEX IF EXISTS idx_ad_clicks_user_id;
DROP INDEX IF EXISTS idx_ad_clicks_ad_id;
DROP INDEX IF EXISTS idx_ad_impressions_created_at;
DROP INDEX IF EXISTS idx_ad_impressions_user_id;
DROP INDEX IF EXISTS idx_ad_impressions_ad_id;

DROP TABLE IF EXISTS ad_clicks;
DROP TABLE IF EXISTS ad_impressions;
*/

