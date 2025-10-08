-- Purple Glow Social - Initial Schema Migration
-- Creates core database tables with RLS policies
-- Migration: 20250108_000000_initial_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================================
-- TABLE: users
-- Purpose: Authentication and user management
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sign_in_at TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

COMMENT ON TABLE users IS 'Authentication and user management';

-- ============================================================================
-- TABLE: business_profiles
-- Purpose: Store business information for AI content generation context
-- ============================================================================

CREATE TABLE business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic Information
  business_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Target Audience
  target_audience TEXT NOT NULL,
  target_demographics JSONB DEFAULT '[]'::jsonb,
  
  -- Services & Areas
  services TEXT[] NOT NULL DEFAULT '{}',
  service_areas TEXT[] NOT NULL DEFAULT '{}',
  
  -- Content Preferences
  preferred_languages TEXT[] NOT NULL DEFAULT ARRAY['English'],
  content_tone TEXT NOT NULL DEFAULT 'professional'
    CHECK (content_tone IN ('professional', 'friendly', 'humorous', 'inspirational')),
  
  -- Brand Identity
  brand_colors JSONB DEFAULT '[]'::jsonb,
  brand_keywords TEXT[] DEFAULT '{}',
  
  -- AI Learning State
  confidence_score DECIMAL(5,2) DEFAULT 0.00 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  automation_enabled BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_user_business UNIQUE (user_id)
);

CREATE INDEX idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX idx_business_profiles_confidence_score ON business_profiles(confidence_score);

ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business profile"
  ON business_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business profile"
  ON business_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business profile"
  ON business_profiles FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE business_profiles IS 'Business information for AI content generation';

-- ============================================================================
-- TABLE: social_accounts
-- Purpose: Store OAuth tokens and metadata for connected social platforms
-- ============================================================================

CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Platform Information
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin')),
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  
  -- OAuth Tokens (encrypted at rest by Supabase)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Account Status
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  
  -- Platform-Specific Data
  platform_data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_user_platform_account UNIQUE (user_id, platform, platform_user_id)
);

CREATE INDEX idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX idx_social_accounts_token_expires_at ON social_accounts(token_expires_at);

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own social accounts"
  ON social_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social accounts"
  ON social_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social accounts"
  ON social_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own social accounts"
  ON social_accounts FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE social_accounts IS 'OAuth tokens and metadata for social platforms';

-- ============================================================================
-- TABLE: subscriptions
-- Purpose: Manage subscription tiers, billing, and usage limits
-- ============================================================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Subscription Details
  tier TEXT NOT NULL DEFAULT 'trial'
    CHECK (tier IN ('trial', 'starter', 'growth', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'canceled', 'paused')),
  
  -- Billing
  paystack_customer_id TEXT,
  paystack_subscription_id TEXT,
  amount_zar DECIMAL(10,2) DEFAULT 0.00,
  
  -- Limits & Usage
  monthly_post_limit INTEGER NOT NULL DEFAULT 50,
  posts_used_this_cycle INTEGER DEFAULT 0,
  
  -- Billing Cycle
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  trial_ends_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  canceled_at TIMESTAMPTZ,
  
  CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);
CREATE INDEX idx_subscriptions_trial_ends_at ON subscriptions(trial_ends_at);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE subscriptions IS 'Subscription tiers, billing, and usage limits';

-- ============================================================================
-- TABLE: posts
-- Purpose: Store generated content with lifecycle management
-- ============================================================================

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  
  -- Content
  content_text TEXT NOT NULL,
  content_language TEXT NOT NULL DEFAULT 'English',
  
  -- AI Generation Metadata
  generated_by TEXT DEFAULT 'gemini-1.5-pro',
  generation_prompt TEXT,
  original_text TEXT,
  edit_count INTEGER DEFAULT 0,
  
  -- Lifecycle State
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_approval', 'approved', 'scheduled', 'published', 'failed', 'archived')),
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Publishing Details
  target_platforms TEXT[] DEFAULT '{}',
  published_to JSONB DEFAULT '{}'::jsonb,
  
  -- Error Handling
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CHECK (
    (status = 'scheduled' AND scheduled_for IS NOT NULL) OR
    (status != 'scheduled')
  )
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_business_profile_id ON posts(business_profile_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_for ON posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_posts_published_at ON posts(published_at);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own posts"
  ON posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE posts IS 'Generated content with lifecycle management';

-- ============================================================================
-- TABLE: post_images
-- Purpose: Store AI-generated or uploaded images for posts
-- ============================================================================

CREATE TABLE post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Image Storage
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  
  -- Image Metadata
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  mime_type TEXT DEFAULT 'image/jpeg',
  
  -- AI Generation
  generated_by TEXT,
  generation_prompt TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_images_post_id ON post_images(post_id);
CREATE INDEX idx_post_images_user_id ON post_images(user_id);

ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own post images"
  ON post_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own post images"
  ON post_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own post images"
  ON post_images FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE post_images IS 'AI-generated or uploaded images for posts';

-- ============================================================================
-- TABLE: brand_assets
-- Purpose: Store logos and brand images uploaded by users
-- ============================================================================

CREATE TABLE brand_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Asset Details
  asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'banner', 'pattern', 'other')),
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  
  -- Metadata
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Usage
  is_primary BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_brand_assets_business_profile_id ON brand_assets(business_profile_id);
CREATE INDEX idx_brand_assets_user_id ON brand_assets(user_id);
CREATE INDEX idx_brand_assets_asset_type ON brand_assets(asset_type);

ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand assets"
  ON brand_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand assets"
  ON brand_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand assets"
  ON brand_assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand assets"
  ON brand_assets FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE brand_assets IS 'Logos and brand images uploaded by users';

-- ============================================================================
-- TABLE: analytics_data
-- Purpose: Store engagement metrics from social platforms
-- ============================================================================

CREATE TABLE analytics_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Platform
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin')),
  platform_post_id TEXT NOT NULL,
  
  -- Engagement Metrics
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  impressions_count INTEGER DEFAULT 0,
  reach_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  
  -- Engagement Rate Calculation
  engagement_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Sync Information
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_post_platform UNIQUE (post_id, platform)
);

CREATE INDEX idx_analytics_data_post_id ON analytics_data(post_id);
CREATE INDEX idx_analytics_data_user_id ON analytics_data(user_id);
CREATE INDEX idx_analytics_data_platform ON analytics_data(platform);
CREATE INDEX idx_analytics_data_synced_at ON analytics_data(synced_at);

ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics data"
  ON analytics_data FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON TABLE analytics_data IS 'Engagement metrics from social platforms';

-- ============================================================================
-- TABLE: confidence_scores
-- Purpose: Track AI learning progress per business for automation decisions
-- ============================================================================

CREATE TABLE confidence_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Scoring Metrics
  total_posts_generated INTEGER DEFAULT 0,
  posts_approved_no_edit INTEGER DEFAULT 0,
  posts_with_minor_edits INTEGER DEFAULT 0,
  posts_with_major_edits INTEGER DEFAULT 0,
  posts_rejected INTEGER DEFAULT 0,
  
  -- Calculated Score
  confidence_score DECIMAL(5,2) DEFAULT 0.00 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Thresholds
  automation_threshold DECIMAL(5,2) DEFAULT 80.00,
  automation_suggested_at TIMESTAMPTZ,
  automation_accepted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_confidence_scores_business_profile_id ON confidence_scores(business_profile_id);
CREATE INDEX idx_confidence_scores_user_id ON confidence_scores(user_id);

ALTER TABLE confidence_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own confidence scores"
  ON confidence_scores FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON TABLE confidence_scores IS 'AI learning progress for automation decisions';

-- ============================================================================
-- TABLE: api_rate_limits
-- Purpose: Track API usage per user per platform
-- ============================================================================

CREATE TABLE api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Platform & Type
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'gemini')),
  limit_type TEXT NOT NULL,
  
  -- Rate Limit Window
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_duration INTERVAL NOT NULL,
  
  -- Usage Tracking
  calls_made INTEGER DEFAULT 0,
  calls_limit INTEGER NOT NULL,
  
  -- Reset Information
  resets_at TIMESTAMPTZ NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_user_platform_limit UNIQUE (user_id, platform, limit_type, window_start)
);

CREATE INDEX idx_api_rate_limits_user_id ON api_rate_limits(user_id);
CREATE INDEX idx_api_rate_limits_platform ON api_rate_limits(platform);
CREATE INDEX idx_api_rate_limits_resets_at ON api_rate_limits(resets_at);

ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
  ON api_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON TABLE api_rate_limits IS 'API usage tracking per user per platform';

-- ============================================================================
-- TABLE: subscription_events
-- Purpose: Audit log for subscription changes and billing events
-- ============================================================================

CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Event Details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'upgraded', 'downgraded', 'canceled', 'reactivated',
    'payment_succeeded', 'payment_failed', 'trial_started', 'trial_ended'
  )),
  
  -- Event Data
  from_tier TEXT,
  to_tier TEXT,
  amount_zar DECIMAL(10,2),
  
  -- Paystack Reference
  paystack_event_id TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscription_events_subscription_id ON subscription_events(subscription_id);
CREATE INDEX idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX idx_subscription_events_event_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_created_at ON subscription_events(created_at);

ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription events"
  ON subscription_events FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON TABLE subscription_events IS 'Audit log for subscription and billing events';

-- ============================================================================
-- TABLE: admin_lead_insights
-- Purpose: Store scraped social media insights for potential leads (Admin only)
-- ============================================================================

CREATE TABLE admin_lead_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Lead Information
  business_name TEXT NOT NULL,
  industry TEXT,
  social_platform TEXT NOT NULL,
  social_handle TEXT NOT NULL,
  
  -- Insights Data
  follower_count INTEGER,
  post_frequency TEXT,
  engagement_quality TEXT,
  content_quality_score DECIMAL(3,2),
  
  -- Opportunity Assessment
  opportunity_score DECIMAL(5,2),
  recommended_tier TEXT,
  notes TEXT,
  
  -- Contact Status
  contact_status TEXT DEFAULT 'new' CHECK (contact_status IN ('new', 'contacted', 'qualified', 'converted', 'not_interested')),
  contacted_at TIMESTAMPTZ,
  
  -- Timestamps
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_lead_insights_opportunity_score ON admin_lead_insights(opportunity_score DESC);
CREATE INDEX idx_admin_lead_insights_contact_status ON admin_lead_insights(contact_status);
CREATE INDEX idx_admin_lead_insights_scraped_at ON admin_lead_insights(scraped_at);

ALTER TABLE admin_lead_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can access lead insights"
  ON admin_lead_insights FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON TABLE admin_lead_insights IS 'Scraped social media insights for leads (Admin only)';
