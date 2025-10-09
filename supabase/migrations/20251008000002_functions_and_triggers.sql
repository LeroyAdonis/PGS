-- Purple Glow Social - Database Functions & Triggers
-- Creates automated triggers for updated_at, engagement rates, confidence scores
-- Migration: 20250108_000001_functions_and_triggers.sql

-- ============================================================================
-- FUNCTION: update_updated_at_column
-- Purpose: Automatically update updated_at timestamp on row modification
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS 'Auto-update updated_at timestamp on UPDATE';

-- ============================================================================
-- TRIGGERS: Apply updated_at to all tables
-- ============================================================================

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_assets_updated_at
  BEFORE UPDATE ON brand_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_data_updated_at
  BEFORE UPDATE ON analytics_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_confidence_scores_updated_at
  BEFORE UPDATE ON confidence_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_rate_limits_updated_at
  BEFORE UPDATE ON api_rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_lead_insights_updated_at
  BEFORE UPDATE ON admin_lead_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: calculate_engagement_rate
-- Purpose: Auto-calculate engagement rate based on metrics
-- Formula: (likes + comments + shares) / reach * 100
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_engagement_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reach_count > 0 THEN
    NEW.engagement_rate := ROUND(
      ((NEW.likes_count + NEW.comments_count + NEW.shares_count)::DECIMAL / NEW.reach_count * 100),
      2
    );
  ELSE
    NEW.engagement_rate := 0.00;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_engagement_rate IS 'Calculate engagement rate from metrics';

CREATE TRIGGER calculate_analytics_engagement_rate
  BEFORE INSERT OR UPDATE ON analytics_data
  FOR EACH ROW EXECUTE FUNCTION calculate_engagement_rate();

-- ============================================================================
-- FUNCTION: update_confidence_score
-- Purpose: Calculate confidence score based on post approval history
-- Formula: (approved_no_edit*10 + minor_edits*5 - major_edits*3 - rejected*5) / total
-- ============================================================================

CREATE OR REPLACE FUNCTION update_confidence_score()
RETURNS TRIGGER AS $$
DECLARE
  v_score DECIMAL(5,2);
BEGIN
  IF NEW.total_posts_generated > 0 THEN
    v_score := (
      (NEW.posts_approved_no_edit * 10.0) +
      (NEW.posts_with_minor_edits * 5.0) -
      (NEW.posts_with_major_edits * 3.0) -
      (NEW.posts_rejected * 5.0)
    ) / NEW.total_posts_generated;

    -- Clamp score between 0 and 100
    NEW.confidence_score := GREATEST(0.00, LEAST(100.00, v_score));

    -- Trigger automation suggestion when threshold reached
    IF NEW.confidence_score >= NEW.automation_threshold AND NEW.automation_suggested_at IS NULL THEN
      NEW.automation_suggested_at := NOW();
    END IF;
  ELSE
    NEW.confidence_score := 0.00;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_confidence_score IS 'Calculate confidence score from post history';

CREATE TRIGGER update_confidence_scores_score
  BEFORE INSERT OR UPDATE ON confidence_scores
  FOR EACH ROW EXECUTE FUNCTION update_confidence_score();

-- ============================================================================
-- FUNCTION: sync_business_profile_confidence
-- Purpose: Keep business_profiles.confidence_score in sync with confidence_scores
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_business_profile_confidence()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE business_profiles
  SET confidence_score = NEW.confidence_score
  WHERE id = NEW.business_profile_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_business_profile_confidence IS 'Sync confidence score to business profile';

CREATE TRIGGER sync_business_profile_confidence_trigger
  AFTER INSERT OR UPDATE ON confidence_scores
  FOR EACH ROW EXECUTE FUNCTION sync_business_profile_confidence();

-- ============================================================================
-- FUNCTION: reset_subscription_usage
-- Purpose: Reset monthly post usage at billing cycle end
-- Called by pg_cron daily
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_subscription_usage()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET
    posts_used_this_cycle = 0,
    current_period_start = current_period_end,
    current_period_end = current_period_end + INTERVAL '30 days'
  WHERE current_period_end <= NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reset_subscription_usage IS 'Reset monthly post usage for billing cycle';

-- ============================================================================
-- FUNCTION: publish_scheduled_posts
-- Purpose: Process posts with status='scheduled' and scheduled_for <= NOW()
-- Updates status to 'published' or 'failed' based on API results
-- Called by pg_cron every minute
-- ============================================================================

CREATE OR REPLACE FUNCTION publish_scheduled_posts()
RETURNS TABLE (
  post_id UUID,
  status TEXT,
  message TEXT
) AS $$
DECLARE
  v_post RECORD;
BEGIN
  -- Select posts ready for publishing
  FOR v_post IN
    SELECT id, user_id, content_text, target_platforms
    FROM posts
    WHERE status = 'scheduled'
      AND scheduled_for <= NOW()
      AND retry_count < 3
    ORDER BY scheduled_for ASC
    LIMIT 100 -- Process batch of 100
  LOOP
    -- This function logs posts that need publishing
    -- Actual platform API calls are handled by Edge Functions
    -- which will update the post status after API calls
    
    post_id := v_post.id;
    status := 'processing';
    message := 'Post queued for Edge Function publishing';
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION publish_scheduled_posts IS 'Queue scheduled posts for Edge Function publishing';

-- ============================================================================
-- FUNCTION: increment_post_usage
-- Purpose: Increment posts_used_this_cycle when a post is created
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_post_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment on new drafts, not on status changes
  IF TG_OP = 'INSERT' THEN
    UPDATE subscriptions
    SET posts_used_this_cycle = posts_used_this_cycle + 1
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_post_usage IS 'Increment subscription post usage on post creation';

CREATE TRIGGER increment_post_usage_trigger
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION increment_post_usage();

-- ============================================================================
-- FUNCTION: create_initial_confidence_score
-- Purpose: Auto-create confidence_scores record when business_profile is created
-- ============================================================================

CREATE OR REPLACE FUNCTION create_initial_confidence_score()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO confidence_scores (
    business_profile_id,
    user_id,
    total_posts_generated,
    posts_approved_no_edit,
    posts_with_minor_edits,
    posts_with_major_edits,
    posts_rejected,
    confidence_score
  ) VALUES (
    NEW.id,
    NEW.user_id,
    0,
    0,
    0,
    0,
    0,
    0.00
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_initial_confidence_score IS 'Auto-create confidence score on business profile creation';

CREATE TRIGGER create_initial_confidence_score_trigger
  AFTER INSERT ON business_profiles
  FOR EACH ROW EXECUTE FUNCTION create_initial_confidence_score();

-- ============================================================================
-- FUNCTION: create_initial_subscription
-- Purpose: Auto-create trial subscription when user signs up
-- ============================================================================

CREATE OR REPLACE FUNCTION create_initial_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (
    user_id,
    tier,
    status,
    monthly_post_limit,
    trial_ends_at
  ) VALUES (
    NEW.id,
    'trial',
    'active',
    50,
    NOW() + INTERVAL '14 days'
  );
  
  -- Log subscription event
  INSERT INTO subscription_events (
    subscription_id,
    user_id,
    event_type,
    to_tier
  ) VALUES (
    (SELECT id FROM subscriptions WHERE user_id = NEW.id),
    NEW.id,
    'trial_started',
    'trial'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_initial_subscription IS 'Auto-create trial subscription on user creation';

CREATE TRIGGER create_initial_subscription_trigger
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_initial_subscription();

-- ============================================================================
-- FUNCTION: check_subscription_limit
-- Purpose: Prevent post creation if monthly limit exceeded
-- ============================================================================

CREATE OR REPLACE FUNCTION check_subscription_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_subscription RECORD;
BEGIN
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = NEW.user_id;
  
  -- Enterprise tier has unlimited posts (monthly_post_limit = -1)
  IF v_subscription.monthly_post_limit = -1 THEN
    RETURN NEW;
  END IF;
  
  -- Check if limit exceeded
  IF v_subscription.posts_used_this_cycle >= v_subscription.monthly_post_limit THEN
    RAISE EXCEPTION 'Monthly post limit exceeded. Upgrade your plan to create more posts.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_subscription_limit IS 'Prevent post creation if monthly limit exceeded';

CREATE TRIGGER check_subscription_limit_trigger
  BEFORE INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION check_subscription_limit();

-- ============================================================================
-- FUNCTION: log_subscription_event
-- Purpose: Auto-log subscription events on tier/status changes
-- ============================================================================

CREATE OR REPLACE FUNCTION log_subscription_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if tier or status changed
  IF TG_OP = 'UPDATE' THEN
    IF OLD.tier != NEW.tier THEN
      INSERT INTO subscription_events (
        subscription_id,
        user_id,
        event_type,
        from_tier,
        to_tier
      ) VALUES (
        NEW.id,
        NEW.user_id,
        CASE
          WHEN NEW.tier > OLD.tier THEN 'upgraded'
          ELSE 'downgraded'
        END,
        OLD.tier,
        NEW.tier
      );
    END IF;
    
    IF OLD.status != NEW.status AND NEW.status = 'canceled' THEN
      INSERT INTO subscription_events (
        subscription_id,
        user_id,
        event_type
      ) VALUES (
        NEW.id,
        NEW.user_id,
        'canceled'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_subscription_event IS 'Auto-log subscription tier/status changes';

CREATE TRIGGER log_subscription_event_trigger
  AFTER UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION log_subscription_event();
