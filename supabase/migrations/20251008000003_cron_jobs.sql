-- Purple Glow Social - Cron Jobs Setup
-- Schedules automated tasks using pg_cron
-- Migration: 20250108_000002_cron_jobs.sql

-- ============================================================================
-- CRON JOB: Reset subscription usage daily at midnight
-- Purpose: Reset posts_used_this_cycle at the end of billing cycles
-- Schedule: Daily at 00:00 UTC
-- ============================================================================

SELECT cron.schedule(
  'reset-subscription-usage',
  '0 0 * * *',
  $$SELECT reset_subscription_usage();$$
);

COMMENT ON FUNCTION reset_subscription_usage IS 'Cron: Reset monthly post usage (daily at midnight)';

-- ============================================================================
-- CRON JOB: Publish scheduled posts every minute
-- Purpose: Process posts with status='scheduled' and scheduled_for <= NOW()
-- Schedule: Every minute
-- Note: This marks posts for publishing; actual API calls happen in Edge Functions
-- ============================================================================

SELECT cron.schedule(
  'publish-scheduled-posts',
  '* * * * *',
  $$SELECT * FROM publish_scheduled_posts();$$
);

COMMENT ON FUNCTION publish_scheduled_posts IS 'Cron: Queue posts for publishing (every minute)';

-- ============================================================================
-- CRON JOB: Expire trials and update subscription status
-- Purpose: Set trial subscriptions to 'past_due' when trial_ends_at passes
-- Schedule: Every 6 hours
-- ============================================================================

SELECT cron.schedule(
  'expire-trials',
  '0 */6 * * *',
  $$
  UPDATE subscriptions
  SET status = 'past_due'
  WHERE tier = 'trial'
    AND status = 'active'
    AND trial_ends_at <= NOW();
  $$
);

-- ============================================================================
-- CRON JOB: Refresh expired OAuth tokens
-- Purpose: Trigger token refresh for social accounts with expiring tokens
-- Schedule: Every hour
-- Note: This marks accounts needing refresh; actual OAuth refresh in Edge Functions
-- ============================================================================

SELECT cron.schedule(
  'check-expiring-tokens',
  '0 * * * *',
  $$
  UPDATE social_accounts
  SET is_active = false
  WHERE token_expires_at IS NOT NULL
    AND token_expires_at <= NOW() + INTERVAL '1 hour'
    AND is_active = true;
  $$
);

-- ============================================================================
-- CRON JOB: Clean up old rate limit records
-- Purpose: Delete expired rate limit tracking records
-- Schedule: Daily at 02:00 UTC
-- ============================================================================

SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 2 * * *',
  $$
  DELETE FROM api_rate_limits
  WHERE resets_at <= NOW() - INTERVAL '7 days';
  $$
);

-- ============================================================================
-- CRON JOB: Archive old published posts
-- Purpose: Archive posts older than 90 days to keep tables lean
-- Schedule: Weekly on Sunday at 03:00 UTC
-- ============================================================================

SELECT cron.schedule(
  'archive-old-posts',
  '0 3 * * 0',
  $$
  UPDATE posts
  SET status = 'archived'
  WHERE status = 'published'
    AND published_at <= NOW() - INTERVAL '90 days';
  $$
);

-- ============================================================================
-- View cron job status (for debugging)
-- ============================================================================

-- SELECT * FROM cron.job;
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
