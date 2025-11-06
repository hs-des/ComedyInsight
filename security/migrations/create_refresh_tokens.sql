-- Migration: Create refresh_tokens table for JWT security
-- Description: Support refresh token rotation and management

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    device_id VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, device_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_device ON refresh_tokens(device_id);

-- Add comments
COMMENT ON TABLE refresh_tokens IS 'Refresh tokens for JWT authentication with rotation support';
COMMENT ON COLUMN refresh_tokens.token IS 'JWT refresh token';
COMMENT ON COLUMN refresh_tokens.device_id IS 'Device identifier for token binding';
COMMENT ON COLUMN refresh_tokens.expires_at IS 'Token expiration timestamp';

-- ============================================================================
-- ROLLBACK SECTION
-- ============================================================================

/*
-- ROLLBACK: Remove refresh_tokens table
DROP INDEX IF EXISTS idx_refresh_tokens_token;
DROP INDEX IF EXISTS idx_refresh_tokens_user;
DROP INDEX IF EXISTS idx_refresh_tokens_expires;
DROP INDEX IF EXISTS idx_refresh_tokens_device;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
*/

