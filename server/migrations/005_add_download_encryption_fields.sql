-- Migration: Add encryption and device tracking to downloads
-- Description: Support encrypted downloads with device-specific tokens

-- Add columns to downloads table
ALTER TABLE downloads
ADD COLUMN IF NOT EXISTS device_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS decryption_token TEXT,
ADD COLUMN IF NOT EXISTS revoked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS iv TEXT,
ADD COLUMN IF NOT EXISTS auth_tag TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_downloads_device_id ON downloads(device_id);
CREATE INDEX IF NOT EXISTS idx_downloads_decryption_token ON downloads(decryption_token);
CREATE INDEX IF NOT EXISTS idx_downloads_revoked ON downloads(revoked);
CREATE INDEX IF NOT EXISTS idx_downloads_expires_at ON downloads(expires_at);

-- Add unique constraint for user-video-device
ALTER TABLE downloads
DROP CONSTRAINT IF EXISTS downloads_user_video_device_unique;

CREATE UNIQUE INDEX downloads_user_video_device_unique 
ON downloads(user_id, video_id, device_id) 
WHERE revoked = FALSE;

-- Add comments
COMMENT ON COLUMN downloads.device_id IS 'Device ID for token binding';
COMMENT ON COLUMN downloads.decryption_token IS 'Token for decrypting file';
COMMENT ON COLUMN downloads.revoked IS 'Whether download is revoked (remote wipe)';
COMMENT ON COLUMN downloads.encrypted IS 'Whether file is encrypted';
COMMENT ON COLUMN downloads.iv IS 'Initialization vector for decryption';
COMMENT ON COLUMN downloads.auth_tag IS 'Auth tag for GCM decryption';

-- ============================================================================
-- ROLLBACK SECTION
-- ============================================================================

/*
-- ROLLBACK: Remove columns and indexes

DROP INDEX IF EXISTS downloads_user_video_device_unique;
DROP INDEX IF EXISTS idx_downloads_auth_tag;
DROP INDEX IF EXISTS idx_downloads_iv;
DROP INDEX IF EXISTS idx_downloads_revoked;
DROP INDEX IF EXISTS idx_downloads_decryption_token;
DROP INDEX IF EXISTS idx_downloads_device_id;
DROP INDEX IF EXISTS idx_downloads_expires_at;

ALTER TABLE downloads
DROP COLUMN IF EXISTS auth_tag,
DROP COLUMN IF EXISTS iv,
DROP COLUMN IF EXISTS encrypted,
DROP COLUMN IF EXISTS revoked,
DROP COLUMN IF EXISTS decryption_token,
DROP COLUMN IF EXISTS device_id;
*/

