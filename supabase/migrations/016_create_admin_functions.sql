-- Admin metrics functions for platform analytics
-- Migration: 016_create_admin_functions.sql

-- Function to get user metrics
CREATE OR REPLACE FUNCTION get_admin_user_metrics()
RETURNS TABLE (
  total_users bigint,
  active_users bigint,
  suspended_users bigint,
  deleted_users bigint,
  new_users_this_month bigint,
  new_users_this_week bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE account_status IN ('active', 'suspended', 'deleted')) as total_users,
    COUNT(*) FILTER (WHERE account_status = 'active') as active_users,
    COUNT(*) FILTER (WHERE account_status = 'suspended') as suspended_users,
    COUNT(*) FILTER (WHERE account_status = 'deleted') as deleted_users,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as new_users_this_month,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_this_week
  FROM users;
END;
$$;

-- Function to get subscription metrics
CREATE OR REPLACE FUNCTION get_admin_subscription_metrics()
RETURNS TABLE (
  total_subscriptions bigint,
  active_subscriptions bigint,
  cancelled_subscriptions bigint,
  trial_subscriptions bigint,
  starter_subscriptions bigint,
  growth_subscriptions bigint,
  enterprise_subscriptions bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_subscriptions,
    COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_subscriptions,
    COUNT(*) FILTER (WHERE status = 'trial') as trial_subscriptions,
    COUNT(*) FILTER (WHERE tier = 'starter') as starter_subscriptions,
    COUNT(*) FILTER (WHERE tier = 'growth') as growth_subscriptions,
    COUNT(*) FILTER (WHERE tier = 'enterprise') as enterprise_subscriptions
  FROM subscriptions;
END;
$$;

-- Function to get post metrics
CREATE OR REPLACE FUNCTION get_admin_post_metrics()
RETURNS TABLE (
  total_posts bigint,
  published_posts bigint,
  draft_posts bigint,
  approved_posts bigint,
  rejected_posts bigint,
  scheduled_posts bigint,
  posts_this_month bigint,
  posts_this_week bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_posts,
    COUNT(*) FILTER (WHERE status = 'published') as published_posts,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_posts,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_posts,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_posts,
    COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_posts,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as posts_this_month,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as posts_this_week
  FROM posts;
END;
$$;

-- Function to get revenue metrics
CREATE OR REPLACE FUNCTION get_admin_revenue_metrics()
RETURNS TABLE (
  total_revenue numeric,
  monthly_recurring_revenue numeric,
  revenue_this_month numeric,
  revenue_this_year numeric,
  average_revenue_per_user numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(amount), 0) as total_revenue,
    COALESCE(SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END), 0) as monthly_recurring_revenue,
    COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as revenue_this_month,
    COALESCE(SUM(CASE WHEN created_at >= date_trunc('year', CURRENT_DATE) THEN amount ELSE 0 END), 0) as revenue_this_year,
    CASE
      WHEN COUNT(DISTINCT user_id) > 0
      THEN COALESCE(SUM(amount), 0) / COUNT(DISTINCT user_id)
      ELSE 0
    END as average_revenue_per_user
  FROM billing_transactions
  WHERE status = 'completed';
END;
$$;

-- Function to get engagement metrics
CREATE OR REPLACE FUNCTION get_admin_engagement_metrics()
RETURNS TABLE (
  total_engagement bigint,
  average_engagement_rate numeric,
  total_reach bigint,
  total_likes bigint,
  total_comments bigint,
  total_shares bigint,
  facebook_engagement bigint,
  instagram_engagement bigint,
  twitter_engagement bigint,
  linkedin_engagement bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(likes + comments + shares), 0) as total_engagement,
    CASE
      WHEN SUM(reach) > 0
      THEN ROUND((SUM(likes + comments + shares)::numeric / SUM(reach)::numeric) * 100, 2)
      ELSE 0
    END as average_engagement_rate,
    COALESCE(SUM(reach), 0) as total_reach,
    COALESCE(SUM(likes), 0) as total_likes,
    COALESCE(SUM(comments), 0) as total_comments,
    COALESCE(SUM(shares), 0) as total_shares,
    COALESCE(SUM(CASE WHEN platform = 'facebook' THEN likes + comments + shares ELSE 0 END), 0) as facebook_engagement,
    COALESCE(SUM(CASE WHEN platform = 'instagram' THEN likes + comments + shares ELSE 0 END), 0) as instagram_engagement,
    COALESCE(SUM(CASE WHEN platform = 'twitter' THEN likes + comments + shares ELSE 0 END), 0) as twitter_engagement,
    COALESCE(SUM(CASE WHEN platform = 'linkedin' THEN likes + comments + shares ELSE 0 END), 0) as linkedin_engagement
  FROM analytics_records
  WHERE collected_at >= CURRENT_DATE - INTERVAL '30 days';
END;
$$;