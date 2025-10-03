-- Performance indexes for optimized queries
-- Note: Many indexes were created inline with table definitions
-- This file adds composite indexes for complex queries

-- Composite index for content calendar filtering
CREATE INDEX idx_posts_business_status_scheduled ON posts(business_profile_id, status, scheduled_time)
    WHERE status IN ('approved', 'scheduled', 'publishing');

-- Composite index for billing history sorted queries
CREATE INDEX idx_billing_subscription_date ON billing_transactions(subscription_id, transaction_date DESC);

-- Composite index for analytics collection queries
CREATE INDEX idx_analytics_publication_collected ON analytics_records(post_publication_id, collected_at DESC);

-- Partial index for failed publications (retry logic)
CREATE INDEX idx_publications_failed_retry ON post_publications(created_at, retry_count)
    WHERE publish_status = 'failed' AND retry_count < 3;

-- Partial index for connected accounts to speed up token refresh queries
CREATE INDEX idx_social_accounts_connected_tokens ON social_media_accounts(token_expires_at)
    WHERE connection_status = 'connected';

-- Index for automation eligibility queries
CREATE INDEX idx_profiles_automation_pending ON business_profiles(created_at, approved_posts_count)
    WHERE automation_eligible_at IS NULL AND approved_posts_count >= 10;

-- GIN index for array searches (platform targets)
CREATE INDEX idx_posts_platform_targets_gin ON posts USING GIN(platform_targets);

-- GIN index for hashtag searches
CREATE INDEX idx_posts_hashtags_gin ON posts USING GIN(hashtags);

-- GIN index for JSONB searches (notification preferences, user edits)
CREATE INDEX idx_users_notification_preferences_gin ON users USING GIN(notification_preferences);
CREATE INDEX idx_posts_user_edits_gin ON posts USING GIN(user_edits);
CREATE INDEX idx_analytics_platform_metrics_gin ON analytics_records USING GIN(platform_metrics);

COMMENT ON INDEX idx_posts_business_status_scheduled IS 'Composite index for content calendar filtering';
COMMENT ON INDEX idx_posts_platform_targets_gin IS 'GIN index for array searches on platform targets';
