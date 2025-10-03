-- Posts table: All content posts (pending, scheduled, published)
CREATE TABLE posts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_profile_id uuid NOT NULL,
    caption text NOT NULL,
    language varchar(10) NOT NULL,
    image_url text,
    image_prompt text,
    hashtags text[] NOT NULL DEFAULT '{}',
    platform_targets varchar(20)[] NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'scheduled', 'publishing', 'published', 'failed', 'rejected')),
    scheduled_time timestamptz,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    user_edits jsonb NOT NULL DEFAULT '[]',
    ai_model_version varchar(50),
    generation_prompt text,
    CONSTRAINT fk_posts_business_profile FOREIGN KEY (business_profile_id) 
        REFERENCES business_profiles(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_posts_business_profile ON posts(business_profile_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_time ON posts(scheduled_time);
CREATE INDEX idx_posts_created_at ON posts(created_at);

COMMENT ON TABLE posts IS 'Stores all content posts with AI-generated captions and images';
COMMENT ON COLUMN posts.user_edits IS 'Array of edit events: [{field, old_value, new_value, timestamp}]';
COMMENT ON COLUMN posts.platform_targets IS 'Array: [facebook, instagram, twitter, linkedin]';
