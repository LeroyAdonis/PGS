-- Database views for optimized queries

-- View 1: Content calendar with publication details
CREATE VIEW v_content_calendar AS
SELECT
    p.id AS post_id,
    p.business_profile_id,
    p.caption,
    p.language,
    p.image_url,
    p.hashtags,
    p.platform_targets,
    p.status,
    p.scheduled_time,
    p.published_at,
    p.created_at,
    COALESCE(
        json_agg(
            json_build_object(
                'platform', sma.platform,
                'username', sma.platform_username,
                'publish_status', pp.publish_status,
                'published_at', pp.published_at
            ) ORDER BY pp.created_at
        ) FILTER (WHERE pp.id IS NOT NULL),
        '[]'::json
    ) AS publications
FROM posts p
LEFT JOIN post_publications pp ON pp.post_id = p.id
LEFT JOIN social_media_accounts sma ON sma.id = pp.social_media_account_id
GROUP BY p.id;

-- View 2: Analytics summary per business profile
CREATE VIEW v_analytics_summary AS
SELECT
    bp.id AS business_profile_id,
    bp.business_name,
    COUNT(DISTINCT p.id) AS total_posts,
    COUNT(DISTINCT CASE WHEN p.status = 'published' THEN p.id END) AS published_posts,
    COALESCE(SUM(ar.likes), 0) AS total_likes,
    COALESCE(SUM(ar.comments), 0) AS total_comments,
    COALESCE(SUM(ar.shares), 0) AS total_shares,
    COALESCE(AVG(ar.engagement_rate), 0) AS avg_engagement_rate,
    MAX(ar.collected_at) AS last_analytics_update
FROM business_profiles bp
LEFT JOIN posts p ON p.business_profile_id = bp.id
LEFT JOIN post_publications pp ON pp.post_id = p.id
LEFT JOIN analytics_records ar ON ar.post_publication_id = pp.id
GROUP BY bp.id, bp.business_name;

COMMENT ON VIEW v_content_calendar IS 'Pre-joined view for content calendar display with publication details';
COMMENT ON VIEW v_analytics_summary IS 'Aggregated analytics per business profile for dashboard';
