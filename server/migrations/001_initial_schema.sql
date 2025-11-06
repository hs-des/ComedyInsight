-- ============================================================================
-- ComedyInsight Database Migration
-- File: 001_initial_schema.sql
-- Description: Initial schema creation for ComedyInsight application
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 1: CORE USER TABLES
-- ============================================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_picture_url TEXT,
    bio TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    date_of_birth DATE,
    gender VARCHAR(20),
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_metadata ON users USING GIN(metadata);

-- OAuth accounts table
CREATE TABLE oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    provider_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

-- Indexes for oauth_accounts
CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider ON oauth_accounts(provider);

-- Phone OTPs table
CREATE TABLE phone_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for phone_otps
CREATE INDEX idx_phone_otps_phone ON phone_otps(phone);
CREATE INDEX idx_phone_otps_expires_at ON phone_otps(expires_at);

-- ============================================================================
-- SECTION 2: CONTENT TABLES
-- ============================================================================

-- Artists table
CREATE TABLE artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    bio TEXT,
    profile_image_url TEXT,
    cover_image_url TEXT,
    nationality VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    social_links JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for artists
CREATE INDEX idx_artists_name ON artists USING GIN(to_tsvector('english', name));
CREATE INDEX idx_artists_slug ON artists(slug);
CREATE INDEX idx_artists_is_active ON artists(is_active);
CREATE INDEX idx_artists_is_featured ON artists(is_featured);
CREATE INDEX idx_artists_metadata ON artists USING GIN(metadata);
CREATE INDEX idx_artists_social_links ON artists USING GIN(social_links);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_url TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for categories
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_categories_display_order ON categories(display_order);

-- Videos table
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    video_url TEXT NOT NULL,
    duration_seconds INTEGER,
    video_type VARCHAR(50) NOT NULL, -- 'short', 'full', 'preview'
    quality VARCHAR(20) NOT NULL, -- '360p', '480p', '720p', '1080p'
    file_size_mb DECIMAL(10, 2),
    mime_type VARCHAR(100),
    language VARCHAR(10) DEFAULT 'en',
    subtitles_available BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for videos
CREATE INDEX idx_videos_title ON videos USING GIN(to_tsvector('english', title));
CREATE INDEX idx_videos_slug ON videos(slug);
CREATE INDEX idx_videos_video_type ON videos(video_type);
CREATE INDEX idx_videos_quality ON videos(quality);
CREATE INDEX idx_videos_is_premium ON videos(is_premium);
CREATE INDEX idx_videos_is_featured ON videos(is_featured);
CREATE INDEX idx_videos_is_active ON videos(is_active);
CREATE INDEX idx_videos_published_at ON videos(published_at);
CREATE INDEX idx_videos_metadata ON videos USING GIN(metadata);
CREATE INDEX idx_videos_tags ON videos USING GIN(tags);
CREATE INDEX idx_videos_created_at ON videos(created_at);

-- Video variants table (additional video quality versions)
CREATE TABLE video_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    quality VARCHAR(20) NOT NULL,
    video_url TEXT NOT NULL,
    file_size_mb DECIMAL(10, 2),
    bitrate_kbps INTEGER,
    mime_type VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, quality)
);

-- Indexes for video_variants
CREATE INDEX idx_video_variants_video_id ON video_variants(video_id);
CREATE INDEX idx_video_variants_quality ON video_variants(quality);

-- Subtitles table
CREATE TABLE subtitles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    subtitle_url TEXT NOT NULL,
    subtitle_file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, language)
);

-- Indexes for subtitles
CREATE INDEX idx_subtitles_video_id ON subtitles(video_id);
CREATE INDEX idx_subtitles_language ON subtitles(language);

-- ============================================================================
-- SECTION 3: RELATIONSHIP TABLES
-- ============================================================================

-- Video-Artist relationship (many-to-many)
CREATE TABLE video_artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    role VARCHAR(100), -- 'main', 'featured', 'guest', etc.
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, artist_id)
);

-- Indexes for video_artists
CREATE INDEX idx_video_artists_video_id ON video_artists(video_id);
CREATE INDEX idx_video_artists_artist_id ON video_artists(artist_id);

-- Video-Category relationship (many-to-many)
CREATE TABLE video_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, category_id)
);

-- Indexes for video_categories
CREATE INDEX idx_video_categories_video_id ON video_categories(video_id);
CREATE INDEX idx_video_categories_category_id ON video_categories(category_id);

-- ============================================================================
-- SECTION 4: USER ENGAGEMENT TABLES
-- ============================================================================

-- Favorites table
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, video_id)
);

-- Indexes for favorites
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_video_id ON favorites(video_id);
CREATE INDEX idx_favorites_created_at ON favorites(created_at);

-- Downloads table
CREATE TABLE downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    quality VARCHAR(20) NOT NULL,
    download_url TEXT NOT NULL,
    file_path TEXT,
    download_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    downloaded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for downloads
CREATE INDEX idx_downloads_user_id ON downloads(user_id);
CREATE INDEX idx_downloads_video_id ON downloads(video_id);
CREATE INDEX idx_downloads_status ON downloads(download_status);
CREATE INDEX idx_downloads_metadata ON downloads USING GIN(metadata);

-- Watch history table
CREATE TABLE watch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    watched_seconds INTEGER DEFAULT 0,
    total_duration_seconds INTEGER,
    completion_percentage DECIMAL(5, 2),
    last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, video_id)
);

-- Indexes for watch_history
CREATE INDEX idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX idx_watch_history_video_id ON watch_history(video_id);
CREATE INDEX idx_watch_history_last_watched_at ON watch_history(last_watched_at);

-- Views table (unique views tracking)
CREATE TABLE views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50),
    country_code VARCHAR(2),
    city VARCHAR(100),
    view_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for views
CREATE INDEX idx_views_video_id ON views(video_id);
CREATE INDEX idx_views_user_id ON views(user_id);
CREATE INDEX idx_views_view_date ON views(view_date);
CREATE INDEX idx_views_ip_address ON views(ip_address);
CREATE INDEX idx_views_country_code ON views(country_code);

-- Fake views logs table
CREATE TABLE fake_views_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL, -- 'boost', 'remove', 'reset'
    fake_views_count INTEGER NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fake_views_logs
CREATE INDEX idx_fake_views_logs_video_id ON fake_views_logs(video_id);
CREATE INDEX idx_fake_views_logs_created_at ON fake_views_logs(created_at);

-- ============================================================================
-- SECTION 5: SUBSCRIPTION & PAYMENT TABLES
-- ============================================================================

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_type VARCHAR(50) NOT NULL, -- 'monthly', 'yearly', 'lifetime'
    status VARCHAR(50) NOT NULL, -- 'active', 'expired', 'cancelled', 'pending'
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for subscriptions
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_subscriptions_metadata ON subscriptions USING GIN(metadata);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL, -- 'credit_card', 'paypal', 'stripe', etc.
    payment_status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
    payment_provider VARCHAR(50), -- 'stripe', 'paypal', etc.
    transaction_id VARCHAR(255),
    provider_response JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for payments
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_provider_response ON payments USING GIN(provider_response);
CREATE INDEX idx_payments_metadata ON payments USING GIN(metadata);

-- ============================================================================
-- SECTION 6: CONTENT MANAGEMENT TABLES
-- ============================================================================

-- Ads table
CREATE TABLE ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    ad_type VARCHAR(50) NOT NULL, -- 'banner', 'video', 'interstitial', 'rewarded'
    position VARCHAR(50) NOT NULL, -- 'pre_roll', 'mid_roll', 'post_roll', 'sidebar', 'top_banner'
    ad_url TEXT NOT NULL,
    image_url TEXT,
    video_url TEXT,
    click_url TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    target_demographics JSONB DEFAULT '{}'::jsonb,
    max_impressions INTEGER,
    current_impressions INTEGER DEFAULT 0,
    max_clicks INTEGER,
    current_clicks INTEGER DEFAULT 0,
    cost_per_impression DECIMAL(10, 4),
    cost_per_click DECIMAL(10, 4),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for ads
CREATE INDEX idx_ads_type ON ads(ad_type);
CREATE INDEX idx_ads_position ON ads(position);
CREATE INDEX idx_ads_is_active ON ads(is_active);
CREATE INDEX idx_ads_target_demographics ON ads USING GIN(target_demographics);
CREATE INDEX idx_ads_metadata ON ads USING GIN(metadata);

-- Homepage sections table
CREATE TABLE homepage_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    title VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    layout_type VARCHAR(50) NOT NULL, -- 'horizontal', 'vertical', 'grid', 'featured'
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for homepage_sections
CREATE INDEX idx_homepage_sections_display_order ON homepage_sections(display_order);
CREATE INDEX idx_homepage_sections_is_active ON homepage_sections(is_active);
CREATE INDEX idx_homepage_sections_metadata ON homepage_sections USING GIN(metadata);

-- Homepage items table
CREATE TABLE homepage_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES homepage_sections(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- 'video', 'artist', 'category'
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for homepage_items
CREATE INDEX idx_homepage_items_section_id ON homepage_items(section_id);
CREATE INDEX idx_homepage_items_video_id ON homepage_items(video_id);
CREATE INDEX idx_homepage_items_artist_id ON homepage_items(artist_id);
CREATE INDEX idx_homepage_items_category_id ON homepage_items(category_id);
CREATE INDEX idx_homepage_items_display_order ON homepage_items(display_order);
CREATE INDEX idx_homepage_items_metadata ON homepage_items USING GIN(metadata);

-- ============================================================================
-- SECTION 7: NOTIFICATION TABLES
-- ============================================================================

-- Push tokens table
CREATE TABLE push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    device_type VARCHAR(50) NOT NULL, -- 'ios', 'android', 'web'
    app_version VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, device_token)
);

-- Indexes for push_tokens
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_is_active ON push_tokens(is_active);
CREATE INDEX idx_push_tokens_device_type ON push_tokens(device_type);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'info', 'warning', 'success', 'video_upload', 'subscription'
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX idx_notifications_metadata ON notifications USING GIN(metadata);

-- ============================================================================
-- SECTION 8: ADMIN & AUTHENTICATION TABLES
-- ============================================================================

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for roles
CREATE INDEX idx_roles_name ON roles(name);

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL, -- 'users', 'videos', 'artists', etc.
    action VARCHAR(100) NOT NULL, -- 'create', 'read', 'update', 'delete', 'publish'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource, action)
);

-- Indexes for permissions
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_action ON permissions(action);

-- Role-permissions relationship (many-to-many)
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- Indexes for role_permissions
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Admin users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_super_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Indexes for admin_users
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_role_id ON admin_users(role_id);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);

-- ============================================================================
-- SECTION 9: AUDIT & LOGGING TABLES
-- ============================================================================

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit_logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_old_values ON audit_logs USING GIN(old_values);
CREATE INDEX idx_audit_logs_new_values ON audit_logs USING GIN(new_values);

-- User settings table
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general', -- 'general', 'privacy', 'notifications', 'playback'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, setting_key)
);

-- Indexes for user_settings
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_user_settings_category ON user_settings(category);

-- ============================================================================
-- SECTION 10: ALTER EXISTING TABLES
-- ============================================================================

-- Add view count columns to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS real_view_count INTEGER DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS visible_view_count INTEGER DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS boosted_view_count INTEGER DEFAULT 0;

-- Indexes for view count columns
CREATE INDEX IF NOT EXISTS idx_videos_real_view_count ON videos(real_view_count);
CREATE INDEX IF NOT EXISTS idx_videos_visible_view_count ON videos(visible_view_count);

-- ============================================================================
-- SECTION 11: TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_accounts_updated_at BEFORE UPDATE ON oauth_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_variants_updated_at BEFORE UPDATE ON video_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subtitles_updated_at BEFORE UPDATE ON subtitles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_downloads_updated_at BEFORE UPDATE ON downloads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watch_history_updated_at BEFORE UPDATE ON watch_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homepage_sections_updated_at BEFORE UPDATE ON homepage_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homepage_items_updated_at BEFORE UPDATE ON homepage_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON push_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update visible view count based on real and boosted counts
CREATE OR REPLACE FUNCTION calculate_visible_view_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.visible_view_count = COALESCE(NEW.real_view_count, 0) + COALESCE(NEW.boosted_view_count, 0);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update visible_view_count
CREATE TRIGGER calculate_videos_visible_view_count BEFORE INSERT OR UPDATE ON videos
    FOR EACH ROW 
    WHEN (NEW.real_view_count IS DISTINCT FROM OLD.real_view_count OR 
          NEW.boosted_view_count IS DISTINCT FROM OLD.boosted_view_count)
    EXECUTE FUNCTION calculate_visible_view_count();

-- ============================================================================
-- SECTION 12: INITIAL DATA
-- ============================================================================

-- Insert default roles
INSERT INTO roles (id, name, description, is_system) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'super_admin', 'Super Administrator with all permissions', TRUE),
    ('550e8400-e29b-41d4-a716-446655440001', 'admin', 'Administrator with content management permissions', TRUE),
    ('550e8400-e29b-41d4-a716-446655440002', 'moderator', 'Content Moderator with limited admin permissions', TRUE),
    ('550e8400-e29b-41d4-a716-446655440003', 'editor', 'Content Editor with content creation permissions', TRUE);

-- Insert default permissions
INSERT INTO permissions (id, name, description, resource, action) VALUES
    ('660e8400-e29b-41d4-a716-446655440000', 'users.create', 'Create users', 'users', 'create'),
    ('660e8400-e29b-41d4-a716-446655440001', 'users.read', 'Read users', 'users', 'read'),
    ('660e8400-e29b-41d4-a716-446655440002', 'users.update', 'Update users', 'users', 'update'),
    ('660e8400-e29b-41d4-a716-446655440003', 'users.delete', 'Delete users', 'users', 'delete'),
    ('660e8400-e29b-41d4-a716-446655440004', 'videos.create', 'Create videos', 'videos', 'create'),
    ('660e8400-e29b-41d4-a716-446655440005', 'videos.read', 'Read videos', 'videos', 'read'),
    ('660e8400-e29b-41d4-a716-446655440006', 'videos.update', 'Update videos', 'videos', 'update'),
    ('660e8400-e29b-41d4-a716-446655440007', 'videos.delete', 'Delete videos', 'videos', 'delete'),
    ('660e8400-e29b-41d4-a716-446655440008', 'videos.publish', 'Publish videos', 'videos', 'publish'),
    ('660e8400-e29b-41d4-a716-446655440009', 'artists.create', 'Create artists', 'artists', 'create'),
    ('660e8400-e29b-41d4-a716-446655440010', 'artists.read', 'Read artists', 'artists', 'read'),
    ('660e8400-e29b-41d4-a716-446655440011', 'artists.update', 'Update artists', 'artists', 'update'),
    ('660e8400-e29b-41d4-a716-446655440012', 'artists.delete', 'Delete artists', 'artists', 'delete'),
    ('660e8400-e29b-41d4-a716-446655440013', 'categories.create', 'Create categories', 'categories', 'create'),
    ('660e8400-e29b-41d4-a716-446655440014', 'categories.read', 'Read categories', 'categories', 'read'),
    ('660e8400-e29b-41d4-a716-446655440015', 'categories.update', 'Update categories', 'categories', 'update'),
    ('660e8400-e29b-41d4-a716-446655440016', 'categories.delete', 'Delete categories', 'categories', 'delete');

-- Assign all permissions to super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    '550e8400-e29b-41d4-a716-446655440000',
    id
FROM permissions;

-- Assign content management permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    '550e8400-e29b-41d4-a716-446655440001',
    id
FROM permissions
WHERE resource IN ('videos', 'artists', 'categories')
AND action IN ('create', 'read', 'update', 'delete', 'publish');

-- Insert default categories
INSERT INTO categories (id, name, slug, description, display_order) VALUES
    ('770e8400-e29b-41d4-a716-446655440000', 'Stand-up Comedy', 'stand-up', 'Stand-up comedy videos', 1),
    ('770e8400-e29b-41d4-a716-446655440001', 'Sketch Comedy', 'sketch', 'Sketch comedy videos', 2),
    ('770e8400-e29b-41d4-a716-446655440002', 'Improv Comedy', 'improv', 'Improv comedy videos', 3),
    ('770e8400-e29b-41d4-a716-446655440003', 'Comedy Specials', 'specials', 'Full comedy specials', 4),
    ('770e8400-e29b-41d4-a716-446655440004', 'Funny Moments', 'funny-moments', 'Funny moments compilation', 5);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

COMMENT ON EXTENSION "uuid-ossp" IS 'UUID generation extension';
COMMENT ON TABLE users IS 'Core user accounts table';
COMMENT ON TABLE oauth_accounts IS 'OAuth provider accounts linked to users';
COMMENT ON TABLE phone_otps IS 'Phone number OTP verification codes';
COMMENT ON TABLE artists IS 'Comedy artists/performers';
COMMENT ON TABLE categories IS 'Video categories with hierarchical support';
COMMENT ON TABLE videos IS 'Main videos table with multiple quality support';
COMMENT ON TABLE video_variants IS 'Additional video quality variants';
COMMENT ON TABLE subtitles IS 'Video subtitles in multiple languages';
COMMENT ON TABLE video_artists IS 'Many-to-many relationship between videos and artists';
COMMENT ON TABLE video_categories IS 'Many-to-many relationship between videos and categories';
COMMENT ON TABLE favorites IS 'User favorite videos';
COMMENT ON TABLE downloads IS 'User video downloads with expiry';
COMMENT ON TABLE subscriptions IS 'User subscription plans';
COMMENT ON TABLE payments IS 'Payment transactions';
COMMENT ON TABLE ads IS 'Advertisement campaigns';
COMMENT ON TABLE homepage_sections IS 'Homepage section configurations';
COMMENT ON TABLE homepage_items IS 'Items displayed in homepage sections';
COMMENT ON TABLE watch_history IS 'User video watch history';
COMMENT ON TABLE views IS 'Individual video view tracking';
COMMENT ON TABLE fake_views_logs IS 'Fake view manipulation logs';
COMMENT ON TABLE push_tokens IS 'Push notification device tokens';
COMMENT ON TABLE notifications IS 'User notifications';
COMMENT ON TABLE roles IS 'Admin roles for RBAC';
COMMENT ON TABLE permissions IS 'System permissions';
COMMENT ON TABLE role_permissions IS 'Role-permission assignments';
COMMENT ON TABLE admin_users IS 'Admin user accounts with roles';
COMMENT ON TABLE audit_logs IS 'System audit trail';
COMMENT ON TABLE user_settings IS 'User preferences and settings';

-- ============================================================================
-- ROLLBACK SECTION (COMMENTED OUT - UNCOMMENT TO REVERT)
-- ============================================================================

/*
-- ROLLBACK: Drop all tables in reverse dependency order

-- Drop triggers first
DROP TRIGGER IF EXISTS calculate_videos_visible_view_count ON videos;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_oauth_accounts_updated_at ON oauth_accounts;
DROP TRIGGER IF EXISTS update_artists_updated_at ON artists;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
DROP TRIGGER IF EXISTS update_video_variants_updated_at ON video_variants;
DROP TRIGGER IF EXISTS update_subtitles_updated_at ON subtitles;
DROP TRIGGER IF EXISTS update_downloads_updated_at ON downloads;
DROP TRIGGER IF EXISTS update_watch_history_updated_at ON watch_history;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
DROP TRIGGER IF EXISTS update_ads_updated_at ON ads;
DROP TRIGGER IF EXISTS update_homepage_sections_updated_at ON homepage_sections;
DROP TRIGGER IF EXISTS update_homepage_items_updated_at ON homepage_items;
DROP TRIGGER IF EXISTS update_push_tokens_updated_at ON push_tokens;
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_visible_view_count();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in reverse dependency order (child tables first)
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS push_tokens CASCADE;
DROP TABLE IF EXISTS fake_views_logs CASCADE;
DROP TABLE IF EXISTS views CASCADE;
DROP TABLE IF EXISTS watch_history CASCADE;
DROP TABLE IF EXISTS homepage_items CASCADE;
DROP TABLE IF EXISTS homepage_sections CASCADE;
DROP TABLE IF EXISTS ads CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS downloads CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS video_categories CASCADE;
DROP TABLE IF EXISTS video_artists CASCADE;
DROP TABLE IF EXISTS subtitles CASCADE;
DROP TABLE IF EXISTS video_variants CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS artists CASCADE;
DROP TABLE IF EXISTS phone_otps CASCADE;
DROP TABLE IF EXISTS oauth_accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop extension (optional - uncomment if needed)
-- DROP EXTENSION IF EXISTS "uuid-ossp";
*/

