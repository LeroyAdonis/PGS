-- Analytics records table: Engagement metrics for published posts
CREATE TABLE analytics_records (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_publication_id uuid NOT NULL,
    collected_at timestamptz NOT NULL DEFAULT now(),
    retention_expires_at timestamptz NOT NULL,
    likes integer NOT NULL DEFAULT 0,
    comments integer NOT NULL DEFAULT 0,
    shares integer NOT NULL DEFAULT 0,
    reach integer,
    impressions integer,
    clicks integer,
    engagement_rate numeric(5,2),
    platform_metrics jsonb NOT NULL DEFAULT '{}',
    CONSTRAINT fk_analytics_post_publication FOREIGN KEY (post_publication_id) 
        REFERENCES post_publications(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_analytics_post_publication ON analytics_records(post_publication_id);
CREATE INDEX idx_analytics_collected_at ON analytics_records(collected_at);
CREATE INDEX idx_analytics_retention_expires ON analytics_records(retention_expires_at);

COMMENT ON TABLE analytics_records IS 'Stores engagement metrics with 6-month retention';
COMMENT ON COLUMN analytics_records.retention_expires_at IS 'Auto-purge date (6 months from collected_at)';
COMMENT ON COLUMN analytics_records.platform_metrics IS 'Platform-specific metrics (saves, story mentions, etc.)';
