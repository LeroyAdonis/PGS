-- Business profiles table: Business information and content generation preferences
CREATE TABLE business_profiles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id uuid NOT NULL,
    business_name varchar(200) NOT NULL,
    industry varchar(100) NOT NULL,
    target_audience text NOT NULL,
    brand_logo_url text,
    primary_color varchar(7),
    secondary_color varchar(7),
    content_tone varchar(50) NOT NULL DEFAULT 'professional' CHECK (content_tone IN ('professional', 'casual', 'friendly', 'formal', 'humorous')),
    content_topics text[] NOT NULL DEFAULT '{}',
    preferred_language varchar(10) NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'af', 'zu', 'xh', 'nso', 'st', 'ss', 'ts', 'tn', 've', 'nr')),
    posting_frequency varchar(20) NOT NULL DEFAULT 'daily' CHECK (posting_frequency IN ('daily', '3x_week', 'weekly', 'custom')),
    automation_enabled boolean NOT NULL DEFAULT false,
    automation_eligible_at timestamptz,
    approved_posts_count integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add foreign key constraint (after users table exists)
ALTER TABLE users ADD CONSTRAINT fk_users_business_profile 
    FOREIGN KEY (business_profile_id) REFERENCES business_profiles(id) ON DELETE SET NULL;

ALTER TABLE business_profiles ADD CONSTRAINT fk_business_profiles_owner 
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_business_profiles_owner ON business_profiles(owner_user_id);
CREATE INDEX idx_business_profiles_automation_eligible ON business_profiles(automation_eligible_at);

COMMENT ON TABLE business_profiles IS 'Stores business information and AI content generation preferences';
COMMENT ON COLUMN business_profiles.automation_eligible_at IS 'Timestamp when became eligible (10 posts + 14 days)';
COMMENT ON COLUMN business_profiles.approved_posts_count IS 'Counter for automation eligibility';
