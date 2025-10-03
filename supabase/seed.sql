-- Seed data for Purple Glow Social development/testing
-- Creates test user, admin user, business profile, social accounts, and subscription
-- Usage: npm run db:seed

-- Clean up existing test data (optional, for re-seeding)
DELETE FROM chat_messages WHERE user_id IN (SELECT id FROM users WHERE email IN ('testuser@example.com', 'admin@purpleglowsocial.com'));
DELETE FROM analytics_records WHERE post_publication_id IN (SELECT pp.id FROM post_publications pp JOIN posts p ON p.id = pp.post_id JOIN business_profiles bp ON bp.id = p.business_profile_id JOIN users u ON u.id = bp.owner_user_id WHERE u.email = 'testuser@example.com');
DELETE FROM post_publications WHERE post_id IN (SELECT p.id FROM posts p JOIN business_profiles bp ON bp.id = p.business_profile_id JOIN users u ON u.id = bp.owner_user_id WHERE u.email = 'testuser@example.com');
DELETE FROM posts WHERE business_profile_id IN (SELECT id FROM business_profiles WHERE owner_user_id IN (SELECT id FROM users WHERE email = 'testuser@example.com'));
DELETE FROM billing_transactions WHERE subscription_id IN (SELECT id FROM subscriptions WHERE user_id IN (SELECT id FROM users WHERE email = 'testuser@example.com'));
DELETE FROM subscriptions WHERE user_id IN (SELECT id FROM users WHERE email = 'testuser@example.com');
DELETE FROM social_media_accounts WHERE business_profile_id IN (SELECT id FROM business_profiles WHERE owner_user_id IN (SELECT id FROM users WHERE email = 'testuser@example.com'));
DELETE FROM business_profiles WHERE owner_user_id IN (SELECT id FROM users WHERE email = 'testuser@example.com');
DELETE FROM users WHERE email IN ('testuser@example.com', 'admin@purpleglowsocial.com');
DELETE FROM admin_users WHERE email = 'admin@purpleglowsocial.com';

-- ============================================================================
-- 1. Create test user account
-- ============================================================================
-- Password: Test1234! (hashed with bcrypt, rounds=10)
-- bcrypt hash: $2b$10$rKJ3qX8YhZ5nQ6X7bB2WLuEZyGxJ4J8nqL8xF9pR6tK5mN3qP7sUe
INSERT INTO users (
    id,
    email,
    password_hash,
    display_name,
    role,
    account_status,
    email_verified,
    created_at,
    last_login_at,
    notification_preferences
) VALUES (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'testuser@example.com',
    '$2b$10$rKJ3qX8YhZ5nQ6X7bB2WLuEZyGxJ4J8nqL8xF9pR6tK5mN3qP7sUe',
    'Test User',
    'business_admin',
    'active',
    true,
    now() - interval '30 days', -- Created 30 days ago for automation eligibility
    now() - interval '1 day',
    '{"email_enabled": true, "in_app_enabled": true, "events": ["post_published", "analytics_ready", "billing_reminder"]}'::jsonb
);

-- ============================================================================
-- 2. Create business profile for test user
-- ============================================================================
INSERT INTO business_profiles (
    id,
    owner_user_id,
    business_name,
    industry,
    target_audience,
    brand_logo_url,
    primary_color,
    secondary_color,
    content_tone,
    content_topics,
    preferred_language,
    posting_frequency,
    automation_enabled,
    automation_eligible_at,
    approved_posts_count,
    created_at,
    updated_at
) VALUES (
    'b1c2d3e4-f5a6-4b5c-8d9e-0f1a2b3c4d5e',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Joe''s Plumbing',
    'Home Services',
    'Homeowners in Johannesburg and Pretoria needing plumbing repairs, installations, and maintenance',
    null,
    '#4F46E5', -- Purple primary
    '#10B981', -- Green secondary
    'friendly',
    ARRAY['plumbing tips', 'emergency repairs', 'water saving', 'home maintenance', 'customer testimonials'],
    'en',
    'daily',
    false, -- Not enabled yet, but eligible
    now() - interval '5 days', -- Became eligible 5 days ago (30 days + 10 posts)
    12, -- 12 approved posts (over the 10 threshold)
    now() - interval '30 days',
    now() - interval '1 day'
);

-- Update user with business_profile_id
UPDATE users 
SET business_profile_id = 'b1c2d3e4-f5a6-4b5c-8d9e-0f1a2b3c4d5e'
WHERE id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';

-- ============================================================================
-- 3. Create social media account connections (mock tokens)
-- ============================================================================
-- Facebook Page connection
INSERT INTO social_media_accounts (
    id,
    business_profile_id,
    platform,
    platform_user_id,
    platform_username,
    access_token,
    refresh_token,
    token_expires_at,
    connection_status,
    last_sync_at,
    created_at,
    updated_at
) VALUES (
    'c1d2e3f4-a5b6-4c5d-8e9f-0a1b2c3d4e5f',
    'b1c2d3e4-f5a6-4b5c-8d9e-0f1a2b3c4d5e',
    'facebook',
    '123456789012345',
    'JoesPlumbingJHB',
    'mock_fb_access_token_encrypted', -- In production, use pgcrypto to encrypt
    null,
    now() + interval '60 days',
    'connected',
    now() - interval '2 hours',
    now() - interval '15 days',
    now() - interval '2 hours'
);

-- Instagram Business Account connection
INSERT INTO social_media_accounts (
    id,
    business_profile_id,
    platform,
    platform_user_id,
    platform_username,
    access_token,
    refresh_token,
    token_expires_at,
    connection_status,
    last_sync_at,
    created_at,
    updated_at
) VALUES (
    'd1e2f3a4-b5c6-4d5e-8f9a-0b1c2d3e4f5a',
    'b1c2d3e4-f5a6-4b5c-8d9e-0f1a2b3c4d5e',
    'instagram',
    '987654321098765',
    'joesplumbing_jhb',
    'mock_ig_access_token_encrypted', -- In production, use pgcrypto to encrypt
    null,
    now() + interval '60 days',
    'connected',
    now() - interval '1 hour',
    now() - interval '10 days',
    now() - interval '1 hour'
);

-- ============================================================================
-- 4. Create subscription (Starter tier - R499/month)
-- ============================================================================
INSERT INTO subscriptions (
    id,
    user_id,
    tier,
    status,
    billing_cycle_start,
    next_billing_date,
    trial_end_date,
    payment_method_token,
    paystack_customer_id,
    paystack_subscription_id,
    posts_used_current_cycle,
    posts_limit,
    platforms_connected,
    platforms_limit,
    team_members_count,
    team_members_limit,
    storage_used_mb,
    storage_limit_mb,
    created_at,
    updated_at,
    cancelled_at
) VALUES (
    'e1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'starter',
    'active',
    date_trunc('month', now()), -- Start of current month
    date_trunc('month', now()) + interval '1 month', -- Next month
    null, -- Trial expired
    'mock_paystack_payment_method_token',
    'mock_paystack_cus_123456',
    'mock_paystack_sub_789012',
    18, -- Used 18 of 30 posts this month
    30,
    2, -- 2 platforms connected (Facebook, Instagram)
    2,
    1, -- Just the owner
    1,
    1.5, -- 1.5 MB used
    2048, -- 2 GB limit
    now() - interval '30 days',
    now() - interval '1 day',
    null
);

-- ============================================================================
-- 5. Create sample posts (with various statuses)
-- ============================================================================
-- Approved post (ready to publish)
INSERT INTO posts (
    id,
    business_profile_id,
    caption,
    language,
    image_url,
    image_prompt,
    hashtags,
    platform_targets,
    status,
    scheduled_time,
    published_at,
    created_at,
    updated_at,
    user_edits,
    ai_model_version,
    generation_prompt
) VALUES (
    'f1a2b3c4-d5e6-4f5a-8b9c-0d1e2f3a4b5c',
    'b1c2d3e4-f5a6-4b5c-8d9e-0f1a2b3c4d5e',
    'Emergency plumbing tip: Know where your main water shutoff valve is located! In case of a burst pipe or major leak, shutting off the water immediately can save you thousands in water damage. Check yours today and show your family where it is. Stay safe! 💧🔧',
    'en',
    null,
    'Professional plumber showing homeowner where the main water shutoff valve is located in a residential home',
    ARRAY['plumbingtips', 'homeowner', 'watersafety', 'emergencyprep', 'plumber'],
    ARRAY['facebook', 'instagram'],
    'approved',
    now() + interval '2 hours',
    null,
    now() - interval '3 hours',
    now() - interval '1 hour',
    '[{"field": "hashtags", "old_value": ["plumbingtips", "homeowner", "emergency"], "new_value": ["plumbingtips", "homeowner", "watersafety", "emergencyprep", "plumber"], "timestamp": "' || (now() - interval '1 hour')::text || '"}]'::jsonb,
    'gemini-1.5-pro',
    'Generate a social media post about emergency plumbing tips for homeowners. Tone: friendly, professional.'
);

-- Published post with analytics
INSERT INTO posts (
    id,
    business_profile_id,
    caption,
    language,
    image_url,
    image_prompt,
    hashtags,
    platform_targets,
    status,
    scheduled_time,
    published_at,
    created_at,
    updated_at,
    user_edits,
    ai_model_version,
    generation_prompt
) VALUES (
    'a2b3c4d5-e6f1-4a5b-8c9d-0e1f2a3b4c5d',
    'b1c2d3e4-f5a6-4b5c-8d9e-0f1a2b3c4d5e',
    '🚿 Dripping tap driving you crazy? Not only is it annoying, but it can waste up to 20,000 liters of water per year! Most leaks are simple fixes. Call Joe''s Plumbing for fast, affordable repairs. We''re here to help! 📞 011-555-1234',
    'en',
    'https://example.com/mock-image-url.png',
    'Close-up of a dripping bathroom tap with water droplets',
    ARRAY['plumber', 'leakrepair', 'watersaving', 'johannesburg', 'homerepair'],
    ARRAY['facebook', 'instagram'],
    'published',
    now() - interval '2 days',
    now() - interval '2 days',
    now() - interval '3 days',
    now() - interval '2 days',
    '[]'::jsonb,
    'gemini-1.5-pro',
    'Generate a post about fixing dripping taps and water conservation. Include a call to action.'
);

-- Pending post (awaiting approval)
INSERT INTO posts (
    id,
    business_profile_id,
    caption,
    language,
    image_url,
    image_prompt,
    hashtags,
    platform_targets,
    status,
    scheduled_time,
    published_at,
    created_at,
    updated_at,
    user_edits,
    ai_model_version,
    generation_prompt
) VALUES (
    'b3c4d5e6-f1a2-4b5c-8d9e-0f1a2b3c4d5e',
    'b1c2d3e4-f5a6-4b5c-8d9e-0f1a2b3c4d5e',
    'Winter is coming! ❄️ Protect your pipes from freezing with these simple tips: 1) Insulate exposed pipes, 2) Keep garage doors closed, 3) Let faucets drip on very cold nights. Prevention is cheaper than repairs! Need help? We''re just a call away.',
    'en',
    null,
    'Frozen pipe with ice, home exterior in winter',
    ARRAY['winterprep', 'plumbingtips', 'frozenpipes', 'homecare'],
    ARRAY['facebook', 'instagram'],
    'pending',
    null,
    null,
    now() - interval '30 minutes',
    now() - interval '30 minutes',
    '[]'::jsonb,
    'gemini-1.5-pro',
    'Generate a post about winter pipe protection for South African homeowners.'
);

-- ============================================================================
-- 6. Create post publications for published post
-- ============================================================================
-- Facebook publication
INSERT INTO post_publications (
    id,
    post_id,
    social_media_account_id,
    platform_post_id,
    publish_status,
    published_at,
    error_message,
    retry_count,
    created_at
) VALUES (
    'c4d5e6f1-a2b3-4c5d-8e9f-0a1b2c3d4e5f',
    'a2b3c4d5-e6f1-4a5b-8c9d-0e1f2a3b4c5d',
    'c1d2e3f4-a5b6-4c5d-8e9f-0a1b2c3d4e5f',
    'fb_post_123456789',
    'published',
    now() - interval '2 days',
    null,
    0,
    now() - interval '2 days'
);

-- Instagram publication
INSERT INTO post_publications (
    id,
    post_id,
    social_media_account_id,
    platform_post_id,
    publish_status,
    published_at,
    error_message,
    retry_count,
    created_at
) VALUES (
    'd5e6f1a2-b3c4-4d5e-8f9a-0b1c2d3e4f5a',
    'a2b3c4d5-e6f1-4a5b-8c9d-0e1f2a3b4c5d',
    'd1e2f3a4-b5c6-4d5e-8f9a-0b1c2d3e4f5a',
    'ig_media_987654321',
    'published',
    now() - interval '2 days',
    null,
    0,
    now() - interval '2 days'
);

-- ============================================================================
-- 7. Create analytics records for published post
-- ============================================================================
-- Facebook analytics
INSERT INTO analytics_records (
    id,
    post_publication_id,
    collected_at,
    retention_expires_at,
    likes,
    comments,
    shares,
    reach,
    impressions,
    clicks,
    engagement_rate,
    platform_metrics
) VALUES (
    'e6f1a2b3-c4d5-4e5f-8a9b-0c1d2e3f4a5b',
    'c4d5e6f1-a2b3-4c5d-8e9f-0a1b2c3d4e5f',
    now() - interval '1 day',
    now() + interval '6 months', -- 6 month retention
    45,
    8,
    12,
    1250,
    1580,
    23,
    5.2,
    '{"reactions": {"like": 32, "love": 8, "wow": 5}, "video_views": 0}'::jsonb
);

-- Instagram analytics
INSERT INTO analytics_records (
    id,
    post_publication_id,
    collected_at,
    retention_expires_at,
    likes,
    comments,
    shares,
    reach,
    impressions,
    clicks,
    engagement_rate,
    platform_metrics
) VALUES (
    'f1a2b3c4-d5e6-4f5a-8b9c-0d1e2f3a4b5c',
    'd5e6f1a2-b3c4-4d5e-8f9a-0b1c2d3e4f5a',
    now() - interval '1 day',
    now() + interval '6 months',
    67,
    15,
    8,
    980,
    1120,
    31,
    9.2,
    '{"saves": 12, "profile_visits": 45, "website_clicks": 18}'::jsonb
);

-- ============================================================================
-- 8. Create billing transaction
-- ============================================================================
INSERT INTO billing_transactions (
    id,
    subscription_id,
    paystack_transaction_id,
    amount,
    currency,
    transaction_type,
    status,
    transaction_date,
    receipt_url,
    error_message,
    metadata
) VALUES (
    'a3b4c5d6-e1f2-4a5b-8c9d-0e1f2a3b4c5d',
    'e1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b',
    'paystack_txn_ref_123456789',
    499.00,
    'ZAR',
    'charge',
    'successful',
    date_trunc('month', now()), -- Beginning of month
    'https://paystack.com/receipt/mock_receipt_123456789',
    null,
    '{"card_type": "visa", "last4": "4242", "bank": "Standard Bank"}'::jsonb
);

-- ============================================================================
-- 9. Create admin user account
-- ============================================================================
-- Password: Admin1234! (hashed with bcrypt, rounds=10)
-- bcrypt hash: $2b$10$xK8mP9qR7sL3nM4oP5qQ6eR7sT8uV9wX0yA1bC2dD3eE4fF5gG6hH
INSERT INTO admin_users (
    id,
    email,
    password_hash,
    display_name,
    admin_role,
    account_status,
    created_at,
    last_login_at
) VALUES (
    'b4c5d6e1-f2a3-4b5c-8d9e-0f1a2b3c4d5e',
    'admin@purpleglowsocial.com',
    '$2b$10$xK8mP9qR7sL3nM4oP5qQ6eR7sT8uV9wX0yA1bC2dD3eE4fF5gG6hH',
    'Super Admin',
    'super_admin',
    'active',
    now() - interval '90 days',
    now() - interval '1 hour'
);

-- ============================================================================
-- 10. Create sample chat messages
-- ============================================================================
INSERT INTO chat_messages (
    id,
    user_id,
    sender,
    message_text,
    interpreted_command,
    command_parameters,
    resulting_action,
    created_at
) VALUES (
    'c5d6e1f2-a3b4-4c5d-8e9f-0a1b2c3d4e5f',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'user',
    'Generate 3 posts about winter plumbing tips',
    'generate_posts',
    '{"count": 3, "topic": "winter plumbing tips"}'::jsonb,
    '3 posts generated successfully',
    now() - interval '5 hours'
);

INSERT INTO chat_messages (
    id,
    user_id,
    sender,
    message_text,
    interpreted_command,
    command_parameters,
    resulting_action,
    created_at
) VALUES (
    'd6e1f2a3-b4c5-4d5e-8f9a-0b1c2d3e4f5a',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'system',
    'I''ve generated 3 posts about winter plumbing tips. They are now pending your approval in the dashboard.',
    null,
    null,
    null,
    now() - interval '5 hours'
);

-- ============================================================================
-- Seed data summary
-- ============================================================================
-- ✅ Test User: testuser@example.com (Password: Test1234!)
-- ✅ Business Profile: Joe's Plumbing (Starter tier, automation eligible)
-- ✅ Social Accounts: Facebook + Instagram (connected)
-- ✅ Posts: 3 posts (1 published with analytics, 1 approved/scheduled, 1 pending)
-- ✅ Subscription: Starter tier (R499/mo, active, 18/30 posts used)
-- ✅ Billing: 1 successful transaction
-- ✅ Admin User: admin@purpleglowsocial.com (Password: Admin1234!)
-- ✅ Chat Messages: 2 sample messages

SELECT 'Seed data applied successfully! 🌱' AS status;
SELECT '👤 Test User: testuser@example.com (Password: Test1234!)' AS info;
SELECT '🏢 Business: Joe''s Plumbing (Starter tier, automation eligible)' AS info;
SELECT '📱 Connected: Facebook + Instagram' AS info;
SELECT '📝 Posts: 3 posts (published, approved, pending)' AS info;
SELECT '👨‍💼 Admin: admin@purpleglowsocial.com (Password: Admin1234!)' AS info;
