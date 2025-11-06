-- Migration: Add Stripe columns to users and subscriptions
-- Description: Support Stripe customer IDs and subscription webhooks

-- Add stripe_customer_id to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Add Stripe columns to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- ============================================================================
-- ROLLBACK SECTION
-- ============================================================================

/*
-- ROLLBACK: Remove columns and indexes

DROP INDEX IF EXISTS idx_subscriptions_stripe_customer_id;
DROP INDEX IF EXISTS idx_subscriptions_stripe_subscription_id;
DROP INDEX IF EXISTS idx_users_stripe_customer_id;

ALTER TABLE subscriptions
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS stripe_subscription_id;

ALTER TABLE users
DROP COLUMN IF EXISTS stripe_customer_id;
*/

