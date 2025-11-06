-- Migration: Add fake views campaign columns
-- Description: Extends fake_views_logs table to support campaign-based view distribution

-- Add new columns to fake_views_logs table
ALTER TABLE fake_views_logs
ADD COLUMN IF NOT EXISTS executed_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration_days INTEGER,
ADD COLUMN IF NOT EXISTS pattern VARCHAR(10),
ADD COLUMN IF NOT EXISTS daily_limit INTEGER,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_fake_views_logs_status ON fake_views_logs(status);
CREATE INDEX IF NOT EXISTS idx_fake_views_logs_created_by ON fake_views_logs(created_by);
CREATE INDEX IF NOT EXISTS idx_fake_views_logs_started_at ON fake_views_logs(started_at);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_fake_views_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fake_views_logs_updated_at
    BEFORE UPDATE ON fake_views_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_fake_views_logs_updated_at();

-- Add comment
COMMENT ON TABLE fake_views_logs IS 'Fake view campaigns with distribution patterns and limits';

-- ============================================================================
-- ROLLBACK SECTION
-- ============================================================================

/*
-- ROLLBACK: Remove columns and indexes

DROP TRIGGER IF EXISTS update_fake_views_logs_updated_at ON fake_views_logs;
DROP FUNCTION IF EXISTS update_fake_views_logs_updated_at();

DROP INDEX IF EXISTS idx_fake_views_logs_started_at;
DROP INDEX IF EXISTS idx_fake_views_logs_created_by;
DROP INDEX IF EXISTS idx_fake_views_logs_status;

ALTER TABLE fake_views_logs
DROP COLUMN IF EXISTS executed_count,
DROP COLUMN IF EXISTS remaining_count,
DROP COLUMN IF EXISTS duration_days,
DROP COLUMN IF EXISTS pattern,
DROP COLUMN IF EXISTS daily_limit,
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS started_at,
DROP COLUMN IF EXISTS ended_at,
DROP COLUMN IF EXISTS updated_at;
*/

