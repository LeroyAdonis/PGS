-- Post publications table: Tracks individual platform publications (many-to-many)
CREATE TABLE post_publications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id uuid NOT NULL,
    social_media_account_id uuid NOT NULL,
    platform_post_id varchar(255),
    publish_status varchar(20) NOT NULL DEFAULT 'pending' CHECK (publish_status IN ('pending', 'publishing', 'published', 'failed')),
    published_at timestamptz,
    error_message text,
    retry_count integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_post_publications_post FOREIGN KEY (post_id) 
        REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_publications_account FOREIGN KEY (social_media_account_id) 
        REFERENCES social_media_accounts(id) ON DELETE CASCADE
);

-- Prevent duplicate publications
ALTER TABLE post_publications ADD CONSTRAINT uniq_post_platform 
    UNIQUE (post_id, social_media_account_id);

-- Create indexes for performance
CREATE INDEX idx_post_publications_post ON post_publications(post_id);
CREATE INDEX idx_post_publications_status ON post_publications(publish_status);
CREATE INDEX idx_post_publications_retry ON post_publications(retry_count) WHERE publish_status = 'failed';

COMMENT ON TABLE post_publications IS 'Tracks individual platform publications with retry logic';
COMMENT ON COLUMN post_publications.platform_post_id IS 'Platform-specific post ID (from API response)';
