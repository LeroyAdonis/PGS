# Data Model: Purple Glow Social

**Feature**: Purple Glow Social - AI-Powered Social Media Manager  
**Date**: October 1, 2025  
**Phase**: 1 - Design & Contracts  
**Database**: PostgreSQL 15+ (Supabase)

## Entity Relationship Diagram (ERD)

```
users (1) ──< (1) business_profiles (1) ──< (*) social_media_accounts
  │                     │
  │                     └──< (*) posts (1) ──< (1) analytics_records
  │
  └──< (1) subscriptions (1) ──< (*) billing_transactions

admin_users (independent)

chat_messages (*) ──> (1) users
```

**Legend**:

- `(1)` = one
- `(*)` = many
- `──<` = one-to-many relationship
- `──>` = many-to-one relationship

---

## Tables

### 1. users

**Purpose**: Stores individual user accounts (business owners, team members)

| Column                   | Type         | Constraints                    | Description                                                      |
| ------------------------ | ------------ | ------------------------------ | ---------------------------------------------------------------- |
| id                       | uuid         | PK, DEFAULT uuid_generate_v4() | Unique user identifier                                           |
| email                    | varchar(255) | NOT NULL, UNIQUE               | User email address                                               |
| password_hash            | varchar(255) | NULL                           | Hashed password (NULL for OAuth-only users)                      |
| display_name             | varchar(100) | NOT NULL                       | User's display name                                              |
| role                     | varchar(20)  | NOT NULL, DEFAULT 'user'       | User role: 'user', 'business_admin', 'team_member'               |
| account_status           | varchar(20)  | NOT NULL, DEFAULT 'active'     | 'active', 'suspended', 'deleted'                                 |
| email_verified           | boolean      | NOT NULL, DEFAULT false        | Email verification status                                        |
| created_at               | timestamptz  | NOT NULL, DEFAULT now()        | Account creation timestamp                                       |
| last_login_at            | timestamptz  | NULL                           | Last successful login                                            |
| notification_preferences | jsonb        | NOT NULL, DEFAULT '{}'         | JSON: {email_enabled, in_app_enabled, events: [...]}             |
| business_profile_id      | uuid         | FK -> business_profiles(id)    | Reference to business profile (NULL for users not yet onboarded) |

**Indexes**:

- `idx_users_email` ON email (for login lookups)
- `idx_users_business_profile_id` ON business_profile_id (for team member queries)
- `idx_users_account_status` ON account_status (for filtering active users)

**Row Level Security (RLS)**:

- Users can read/update their own record
- Business admins can read team member records for their business
- Admin users can read all records

---

### 2. business_profiles

**Purpose**: Stores business information and content generation preferences

| Column                 | Type         | Constraints                      | Description                                                |
| ---------------------- | ------------ | -------------------------------- | ---------------------------------------------------------- |
| id                     | uuid         | PK, DEFAULT uuid_generate_v4()   | Unique profile identifier                                  |
| owner_user_id          | uuid         | NOT NULL, FK -> users(id)        | Business owner (creator of account)                        |
| business_name          | varchar(200) | NOT NULL                         | Business display name                                      |
| industry               | varchar(100) | NOT NULL                         | Industry category (dropdown)                               |
| target_audience        | text         | NOT NULL                         | Description of target customers                            |
| brand_logo_url         | text         | NULL                             | Supabase Storage URL for logo                              |
| primary_color          | varchar(7)   | NULL                             | Hex color code (e.g., #FF5733)                             |
| secondary_color        | varchar(7)   | NULL                             | Hex color code                                             |
| content_tone           | varchar(50)  | NOT NULL, DEFAULT 'professional' | 'professional', 'casual', 'friendly', 'formal', 'humorous' |
| content_topics         | text[]       | NOT NULL, DEFAULT '{}'           | Array of topics/keywords                                   |
| preferred_language     | varchar(10)  | NOT NULL, DEFAULT 'en'           | ISO code: en, af, zu, xh, etc.                             |
| posting_frequency      | varchar(20)  | NOT NULL, DEFAULT 'daily'        | 'daily', '3x_week', 'weekly', 'custom'                     |
| automation_enabled     | boolean      | NOT NULL, DEFAULT false          | Auto-posting mode (requires eligibility)                   |
| automation_eligible_at | timestamptz  | NULL                             | Timestamp when became eligible (10 posts + 14 days)        |
| approved_posts_count   | integer      | NOT NULL, DEFAULT 0              | Counter for automation eligibility                         |
| created_at             | timestamptz  | NOT NULL, DEFAULT now()          | Profile creation timestamp                                 |
| updated_at             | timestamptz  | NOT NULL, DEFAULT now()          | Last modification timestamp                                |

**Indexes**:

- `idx_business_profiles_owner` ON owner_user_id
- `idx_business_profiles_automation_eligible` ON automation_eligible_at (for background job queries)

**Row Level Security (RLS)**:

- Users can read/update their own business profile
- Team members can read their business profile
- Admin users can read all profiles

---

### 3. social_media_accounts

**Purpose**: Stores OAuth connections to social media platforms

| Column              | Type         | Constraints                           | Description                                            |
| ------------------- | ------------ | ------------------------------------- | ------------------------------------------------------ |
| id                  | uuid         | PK, DEFAULT uuid_generate_v4()        | Unique account identifier                              |
| business_profile_id | uuid         | NOT NULL, FK -> business_profiles(id) | Associated business profile                            |
| platform            | varchar(20)  | NOT NULL                              | 'facebook', 'instagram', 'twitter', 'linkedin'         |
| platform_user_id    | varchar(255) | NOT NULL                              | Platform-specific user/page ID                         |
| platform_username   | varchar(255) | NOT NULL                              | Display username/handle                                |
| access_token        | text         | NOT NULL                              | Encrypted OAuth access token (encrypted with pgcrypto) |
| refresh_token       | text         | NULL                                  | Encrypted OAuth refresh token (if supported)           |
| token_expires_at    | timestamptz  | NOT NULL                              | Token expiration timestamp                             |
| connection_status   | varchar(20)  | NOT NULL, DEFAULT 'connected'         | 'connected', 'expired', 'revoked', 'error'             |
| last_sync_at        | timestamptz  | NULL                                  | Last successful API call timestamp                     |
| created_at          | timestamptz  | NOT NULL, DEFAULT now()               | Initial connection timestamp                           |
| updated_at          | timestamptz  | NOT NULL, DEFAULT now()               | Last modification timestamp                            |

**Unique Constraints**:

- `uniq_platform_account` ON (business_profile_id, platform, platform_user_id) - prevent duplicate connections

**Indexes**:

- `idx_social_accounts_business_profile` ON business_profile_id
- `idx_social_accounts_token_expiry` ON token_expires_at (for token refresh job)
- `idx_social_accounts_status` ON connection_status

**Row Level Security (RLS)**:

- Users can CRUD their own business's social accounts
- Team members can read their business's social accounts
- Admin users can read all accounts

**Security**:

- `access_token` and `refresh_token` encrypted at rest using `pgcrypto` extension
- Tokens decrypted only in Supabase Edge Functions (server-side)

---

### 4. posts

**Purpose**: Stores all content posts (pending, scheduled, published)

| Column              | Type          | Constraints                           | Description                                                                         |
| ------------------- | ------------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| id                  | uuid          | PK, DEFAULT uuid_generate_v4()        | Unique post identifier                                                              |
| business_profile_id | uuid          | NOT NULL, FK -> business_profiles(id) | Associated business profile                                                         |
| caption             | text          | NOT NULL                              | Post caption/text content                                                           |
| language            | varchar(10)   | NOT NULL                              | ISO language code (matches profile preference)                                      |
| image_url           | text          | NULL                                  | Supabase Storage URL for image                                                      |
| image_prompt        | text          | NULL                                  | AI prompt used to generate image (for regeneration)                                 |
| hashtags            | text[]        | NOT NULL, DEFAULT '{}'                | Array of hashtags (without #)                                                       |
| platform_targets    | varchar(20)[] | NOT NULL                              | Array: ['facebook', 'instagram', 'twitter', 'linkedin']                             |
| status              | varchar(20)   | NOT NULL, DEFAULT 'pending'           | 'pending', 'approved', 'scheduled', 'publishing', 'published', 'failed', 'rejected' |
| scheduled_time      | timestamptz   | NULL                                  | When to publish (NULL for immediate publish)                                        |
| published_at        | timestamptz   | NULL                                  | Actual publish timestamp                                                            |
| created_at          | timestamptz   | NOT NULL, DEFAULT now()               | AI generation timestamp                                                             |
| updated_at          | timestamptz   | NOT NULL, DEFAULT now()               | Last modification timestamp                                                         |
| user_edits          | jsonb         | NOT NULL, DEFAULT '[]'                | Array of edit events: [{field, old_value, new_value, timestamp}]                    |
| ai_model_version    | varchar(50)   | NULL                                  | Gemini model version used (for tracking)                                            |
| generation_prompt   | text          | NULL                                  | Full AI prompt used (for debugging/training)                                        |

**Indexes**:

- `idx_posts_business_profile` ON business_profile_id
- `idx_posts_status` ON status
- `idx_posts_scheduled_time` ON scheduled_time (for publishing cron job)
- `idx_posts_created_at` ON created_at (for calendar view sorting)

**Row Level Security (RLS)**:

- Users can CRUD posts for their business profile
- Team members can CRUD posts for their business profile
- Admin users can read all posts

---

### 5. post_publications

**Purpose**: Tracks individual platform publications for each post (many-to-many)

| Column                  | Type         | Constraints                               | Description                                    |
| ----------------------- | ------------ | ----------------------------------------- | ---------------------------------------------- |
| id                      | uuid         | PK, DEFAULT uuid_generate_v4()            | Unique publication identifier                  |
| post_id                 | uuid         | NOT NULL, FK -> posts(id)                 | Associated post                                |
| social_media_account_id | uuid         | NOT NULL, FK -> social_media_accounts(id) | Target platform account                        |
| platform_post_id        | varchar(255) | NULL                                      | Platform-specific post ID (from API response)  |
| publish_status          | varchar(20)  | NOT NULL, DEFAULT 'pending'               | 'pending', 'publishing', 'published', 'failed' |
| published_at            | timestamptz  | NULL                                      | Actual publish timestamp on platform           |
| error_message           | text         | NULL                                      | Error details if publish_status = 'failed'     |
| retry_count             | integer      | NOT NULL, DEFAULT 0                       | Number of retry attempts                       |
| created_at              | timestamptz  | NOT NULL, DEFAULT now()                   | Record creation timestamp                      |

**Unique Constraints**:

- `uniq_post_platform` ON (post_id, social_media_account_id) - prevent duplicate publications

**Indexes**:

- `idx_post_publications_post` ON post_id
- `idx_post_publications_status` ON publish_status
- `idx_post_publications_retry` ON retry_count WHERE publish_status = 'failed' (for retry job)

**Row Level Security (RLS)**:

- Users can read publications for their business's posts
- Admin users can read all publications

---

### 6. analytics_records

**Purpose**: Stores engagement metrics for published posts

| Column               | Type         | Constraints                           | Description                                             |
| -------------------- | ------------ | ------------------------------------- | ------------------------------------------------------- |
| id                   | uuid         | PK, DEFAULT uuid_generate_v4()        | Unique analytics record identifier                      |
| post_publication_id  | uuid         | NOT NULL, FK -> post_publications(id) | Associated publication                                  |
| collected_at         | timestamptz  | NOT NULL, DEFAULT now()               | Metrics collection timestamp                            |
| retention_expires_at | timestamptz  | NOT NULL                              | Auto-purge date (6 months from collected_at)            |
| likes                | integer      | NOT NULL, DEFAULT 0                   | Like count                                              |
| comments             | integer      | NOT NULL, DEFAULT 0                   | Comment count                                           |
| shares               | integer      | NOT NULL, DEFAULT 0                   | Share/retweet count                                     |
| reach                | integer      | NULL                                  | Unique users reached (platform-specific)                |
| impressions          | integer      | NULL                                  | Total views (platform-specific)                         |
| clicks               | integer      | NULL                                  | Link clicks (if post has URL)                           |
| engagement_rate      | numeric(5,2) | NULL                                  | Calculated: (likes+comments+shares)/reach \* 100        |
| platform_metrics     | jsonb        | NOT NULL, DEFAULT '{}'                | Platform-specific metrics (saves, story mentions, etc.) |

**Indexes**:

- `idx_analytics_post_publication` ON post_publication_id
- `idx_analytics_collected_at` ON collected_at
- `idx_analytics_retention_expires` ON retention_expires_at (for purge job)

**Row Level Security (RLS)**:

- Users can read analytics for their business's posts
- Admin users can read all analytics

**Automated Purge**:

- Supabase Edge Function runs daily, deletes records where `retention_expires_at < now()`

---

### 7. subscriptions

**Purpose**: Stores subscription tier and billing information

| Column                   | Type          | Constraints                       | Description                                           |
| ------------------------ | ------------- | --------------------------------- | ----------------------------------------------------- |
| id                       | uuid          | PK, DEFAULT uuid_generate_v4()    | Unique subscription identifier                        |
| user_id                  | uuid          | NOT NULL, UNIQUE, FK -> users(id) | Associated user (one subscription per user)           |
| tier                     | varchar(20)   | NOT NULL                          | 'starter', 'growth', 'enterprise'                     |
| status                   | varchar(20)   | NOT NULL, DEFAULT 'trial'         | 'trial', 'active', 'past_due', 'cancelled', 'expired' |
| billing_cycle_start      | date          | NOT NULL                          | Start of current billing cycle                        |
| next_billing_date        | date          | NOT NULL                          | Next charge date                                      |
| trial_end_date           | date          | NULL                              | End of 14-day trial (NULL if not in trial)            |
| payment_method_token     | varchar(255)  | NULL                              | Paystack payment method token                         |
| paystack_customer_id     | varchar(255)  | NULL                              | Paystack customer ID                                  |
| paystack_subscription_id | varchar(255)  | NULL                              | Paystack subscription ID (for recurring billing)      |
| posts_used_current_cycle | integer       | NOT NULL, DEFAULT 0               | Posts generated this billing cycle                    |
| posts_limit              | integer       | NOT NULL                          | Monthly post limit (30/120/9999 for unlimited)        |
| platforms_connected      | integer       | NOT NULL, DEFAULT 0               | Current platform connections                          |
| platforms_limit          | integer       | NOT NULL                          | Max platforms (2/4/4)                                 |
| team_members_count       | integer       | NOT NULL, DEFAULT 1               | Current team member count (including owner)           |
| team_members_limit       | integer       | NOT NULL                          | Max team members (1/3/10)                             |
| storage_used_mb          | numeric(10,2) | NOT NULL, DEFAULT 0               | Current storage usage in MB                           |
| storage_limit_mb         | integer       | NOT NULL                          | Storage limit in MB (2048/10240/51200)                |
| created_at               | timestamptz   | NOT NULL, DEFAULT now()           | Subscription start timestamp                          |
| updated_at               | timestamptz   | NOT NULL, DEFAULT now()           | Last modification timestamp                           |
| cancelled_at             | timestamptz   | NULL                              | Cancellation timestamp (if cancelled)                 |

**Indexes**:

- `idx_subscriptions_user` ON user_id
- `idx_subscriptions_status` ON status
- `idx_subscriptions_next_billing` ON next_billing_date (for billing cron job)
- `idx_subscriptions_trial_end` ON trial_end_date (for trial expiry job)

**Row Level Security (RLS)**:

- Users can read their own subscription
- Admin users can read all subscriptions

**Tier Limits** (enforced in application logic):
| Tier | Posts/Month | Platforms | Users | Storage |
|------|-------------|-----------|-------|---------|
| Starter | 30 | 2 | 1 | 2GB |
| Growth | 120 | 4 | 3 | 10GB |
| Enterprise | Unlimited (9999) | 4 | 10 | 50GB |

**Pricing**:

- Starter: R499/month
- Growth: R999/month
- Enterprise: R1999/month

---

### 8. billing_transactions

**Purpose**: Stores billing history (payments, refunds)

| Column                  | Type          | Constraints                       | Description                                   |
| ----------------------- | ------------- | --------------------------------- | --------------------------------------------- |
| id                      | uuid          | PK, DEFAULT uuid_generate_v4()    | Unique transaction identifier                 |
| subscription_id         | uuid          | NOT NULL, FK -> subscriptions(id) | Associated subscription                       |
| paystack_transaction_id | varchar(255)  | NOT NULL, UNIQUE                  | Paystack transaction reference                |
| amount                  | numeric(10,2) | NOT NULL                          | Transaction amount (in ZAR)                   |
| currency                | varchar(3)    | NOT NULL, DEFAULT 'ZAR'           | Currency code                                 |
| transaction_type        | varchar(20)   | NOT NULL                          | 'charge', 'refund', 'chargeback'              |
| status                  | varchar(20)   | NOT NULL                          | 'pending', 'successful', 'failed', 'refunded' |
| transaction_date        | timestamptz   | NOT NULL, DEFAULT now()           | Transaction timestamp                         |
| receipt_url             | text          | NULL                              | Paystack-generated receipt URL                |
| error_message           | text          | NULL                              | Error details if status = 'failed'            |
| metadata                | jsonb         | NOT NULL, DEFAULT '{}'            | Additional transaction details from Paystack  |

**Indexes**:

- `idx_billing_transactions_subscription` ON subscription_id
- `idx_billing_transactions_date` ON transaction_date
- `idx_billing_transactions_status` ON status

**Row Level Security (RLS)**:

- Users can read their own subscription's transactions
- Admin users can read all transactions

---

### 9. admin_users

**Purpose**: Stores administrator accounts with elevated privileges

| Column         | Type         | Constraints                    | Description                               |
| -------------- | ------------ | ------------------------------ | ----------------------------------------- |
| id             | uuid         | PK, DEFAULT uuid_generate_v4() | Unique admin identifier                   |
| email          | varchar(255) | NOT NULL, UNIQUE               | Admin email address                       |
| password_hash  | varchar(255) | NOT NULL                       | Hashed password                           |
| display_name   | varchar(100) | NOT NULL                       | Admin display name                        |
| admin_role     | varchar(20)  | NOT NULL                       | 'super_admin', 'support_admin', 'analyst' |
| account_status | varchar(20)  | NOT NULL, DEFAULT 'active'     | 'active', 'suspended'                     |
| created_at     | timestamptz  | NOT NULL, DEFAULT now()        | Account creation timestamp                |
| last_login_at  | timestamptz  | NULL                           | Last successful login                     |

**Indexes**:

- `idx_admin_users_email` ON email
- `idx_admin_users_role` ON admin_role

**Row Level Security (RLS)**:

- Admin users can read all admin records
- Super admins can CRUD admin records

**Admin Roles**:

- `super_admin`: Full access (user management, settings, analytics)
- `support_admin`: User support (view users, adjust subscriptions, suspend accounts)
- `analyst`: Read-only access (platform metrics, user analytics)

---

### 10. chat_messages

**Purpose**: Stores conversational interface message history

| Column              | Type         | Constraints                    | Description                                                   |
| ------------------- | ------------ | ------------------------------ | ------------------------------------------------------------- |
| id                  | uuid         | PK, DEFAULT uuid_generate_v4() | Unique message identifier                                     |
| user_id             | uuid         | NOT NULL, FK -> users(id)      | User who sent/received message                                |
| sender              | varchar(10)  | NOT NULL                       | 'user', 'system'                                              |
| message_text        | text         | NOT NULL                       | Message content                                               |
| interpreted_command | varchar(100) | NULL                           | Extracted command (e.g., 'generate_posts', 'show_analytics')  |
| command_parameters  | jsonb        | NULL                           | Parsed parameters (e.g., {count: 5, topic: 'product launch'}) |
| resulting_action    | text         | NULL                           | Description of action taken (e.g., '5 posts generated')       |
| created_at          | timestamptz  | NOT NULL, DEFAULT now()        | Message timestamp                                             |

**Indexes**:

- `idx_chat_messages_user` ON user_id
- `idx_chat_messages_created` ON created_at

**Row Level Security (RLS)**:

- Users can read/create their own messages
- Admin users can read all messages

**Retention**:

- Keep last 100 messages per user (delete older messages via background job)

---

## Database Functions & Triggers

### 1. update_updated_at_column()

**Purpose**: Automatically update `updated_at` timestamp on row modifications

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Apply to tables**:

- business_profiles
- social_media_accounts
- posts
- subscriptions

### 2. check_automation_eligibility()

**Purpose**: Update `automation_eligible_at` when user approves 10th post and account is 14+ days old

```sql
CREATE OR REPLACE FUNCTION check_automation_eligibility()
RETURNS TRIGGER AS $$
DECLARE
    v_business_profile business_profiles%ROWTYPE;
    v_account_age interval;
BEGIN
    -- Only check when post is approved
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        SELECT * INTO v_business_profile
        FROM business_profiles
        WHERE id = NEW.business_profile_id;

        -- Increment approved posts counter
        UPDATE business_profiles
        SET approved_posts_count = approved_posts_count + 1
        WHERE id = NEW.business_profile_id;

        -- Check eligibility: 10 posts + 14 days active
        v_account_age := now() - v_business_profile.created_at;

        IF (v_business_profile.approved_posts_count + 1) >= 10
           AND v_account_age >= interval '14 days'
           AND v_business_profile.automation_eligible_at IS NULL THEN
            UPDATE business_profiles
            SET automation_eligible_at = now()
            WHERE id = NEW.business_profile_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. enforce_tier_limits()

**Purpose**: Prevent exceeding subscription tier limits

```sql
CREATE OR REPLACE FUNCTION enforce_tier_limits()
RETURNS TRIGGER AS $$
DECLARE
    v_subscription subscriptions%ROWTYPE;
BEGIN
    SELECT * INTO v_subscription
    FROM subscriptions
    WHERE user_id IN (
        SELECT owner_user_id FROM business_profiles WHERE id = NEW.business_profile_id
    );

    -- Check post limit
    IF TG_TABLE_NAME = 'posts' AND NEW.status != 'rejected' THEN
        IF v_subscription.posts_used_current_cycle >= v_subscription.posts_limit THEN
            RAISE EXCEPTION 'Monthly post limit reached. Upgrade subscription or wait for next billing cycle.';
        END IF;
    END IF;

    -- Check platform limit
    IF TG_TABLE_NAME = 'social_media_accounts' THEN
        IF v_subscription.platforms_connected >= v_subscription.platforms_limit THEN
            RAISE EXCEPTION 'Platform connection limit reached. Upgrade subscription to connect more platforms.';
        END IF;
    END IF;

    -- Check storage limit
    IF TG_TABLE_NAME = 'posts' AND NEW.image_url IS NOT NULL THEN
        IF v_subscription.storage_used_mb >= v_subscription.storage_limit_mb THEN
            RAISE EXCEPTION 'Storage limit reached. Upgrade subscription or delete old images.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Database Views

### 1. v_content_calendar

**Purpose**: Pre-joined view for content calendar display

```sql
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
                'publish_status', pp.publish_status
            )
        ) FILTER (WHERE pp.id IS NOT NULL),
        '[]'
    ) AS publications
FROM posts p
LEFT JOIN post_publications pp ON pp.post_id = p.id
LEFT JOIN social_media_accounts sma ON sma.id = pp.social_media_account_id
GROUP BY p.id;
```

### 2. v_analytics_summary

**Purpose**: Aggregated analytics per business profile

```sql
CREATE VIEW v_analytics_summary AS
SELECT
    bp.id AS business_profile_id,
    COUNT(DISTINCT p.id) AS total_posts,
    COUNT(DISTINCT CASE WHEN p.status = 'published' THEN p.id END) AS published_posts,
    SUM(ar.likes) AS total_likes,
    SUM(ar.comments) AS total_comments,
    SUM(ar.shares) AS total_shares,
    AVG(ar.engagement_rate) AS avg_engagement_rate,
    MAX(ar.collected_at) AS last_analytics_update
FROM business_profiles bp
LEFT JOIN posts p ON p.business_profile_id = bp.id
LEFT JOIN post_publications pp ON pp.post_id = p.id
LEFT JOIN analytics_records ar ON ar.post_publication_id = pp.id
GROUP BY bp.id;
```

---

## Security Policies (Row Level Security)

### Enable RLS on all tables

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can read their own data
CREATE POLICY "Users can view own record" ON users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own record" ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- Business profiles accessible by owner and team members
CREATE POLICY "Users can view own business profile" ON business_profiles
    FOR SELECT
    USING (
        owner_user_id = auth.uid()
        OR id IN (
            SELECT business_profile_id
            FROM users
            WHERE id = auth.uid()
        )
    );

-- Admin policies (full access)
CREATE POLICY "Admins can view all" ON users
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid() AND account_status = 'active'
    ));
```

---

## Migrations

### Migration Order

1. **001_create_extensions.sql**: Install pgcrypto for encryption
2. **002_create_users_table.sql**: Create users table
3. **003_create_business_profiles_table.sql**: Create business profiles table
4. **004_create_social_media_accounts_table.sql**: Create social media accounts table
5. **005_create_posts_table.sql**: Create posts table
6. **006_create_post_publications_table.sql**: Create post publications table
7. **007_create_analytics_records_table.sql**: Create analytics records table
8. **008_create_subscriptions_table.sql**: Create subscriptions table
9. **009_create_billing_transactions_table.sql**: Create billing transactions table
10. **010_create_admin_users_table.sql**: Create admin users table
11. **011_create_chat_messages_table.sql**: Create chat messages table
12. **012_create_triggers.sql**: Create all triggers
13. **013_create_views.sql**: Create all views
14. **014_create_rls_policies.sql**: Enable RLS and create policies
15. **015_seed_data.sql**: Insert initial data (admin user, default tiers)

---

## Type Safety

### Generated TypeScript Types

Use Supabase CLI to generate types:

```bash
supabase gen types typescript --local > lib/supabase/types.ts
```

Example generated type:

```typescript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string
          account_status: 'active' | 'suspended' | 'deleted'
          created_at: string
          // ... all columns
        }
        Insert: Omit<Row, 'id' | 'created_at'>
        Update: Partial<Insert>
      }
      // ... all tables
    }
  }
}
```

---

## Validation Rules

### Application-Level Validation (Zod)

```typescript
import { z } from 'zod'

export const BusinessProfileSchema = z.object({
  business_name: z.string().min(2).max(200),
  industry: z.string().min(1),
  target_audience: z.string().min(10),
  brand_logo_url: z.string().url().optional(),
  primary_color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  secondary_color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  content_tone: z.enum(['professional', 'casual', 'friendly', 'formal', 'humorous']),
  content_topics: z.array(z.string()).min(1),
  preferred_language: z.enum(['en', 'af', 'zu', 'xh', 'nso', 'st', 'ss', 'ts', 'tn', 've', 'nr']),
  posting_frequency: z.enum(['daily', '3x_week', 'weekly', 'custom']),
})

export const PostSchema = z.object({
  caption: z.string().min(1).max(5000),
  language: z.string().length(2),
  hashtags: z.array(z.string()).max(30),
  platform_targets: z.array(z.enum(['facebook', 'instagram', 'twitter', 'linkedin'])).min(1),
  scheduled_time: z.string().datetime().optional(),
})
```

---

## Performance Considerations

### Indexing Strategy

**High-priority indexes** (query performance critical):

- `posts.business_profile_id` (dashboard queries)
- `posts.scheduled_time` (publishing cron job)
- `analytics_records.retention_expires_at` (purge job)
- `subscriptions.next_billing_date` (billing cron job)

**Composite indexes** (for complex queries):

- `(business_profile_id, status, scheduled_time)` on posts (content calendar filtering)
- `(user_id, transaction_date)` on billing_transactions (billing history sorted)

### Query Optimization

- Use `EXPLAIN ANALYZE` to profile slow queries
- Implement pagination for large result sets (posts, analytics)
- Cache aggregated analytics in Redis for dashboard (refresh hourly)
- Use materialized views for complex analytics (refresh daily)

---

## Data Retention & Archival

### Automated Cleanup

**Analytics Records**: Delete after 6 months

```sql
DELETE FROM analytics_records
WHERE retention_expires_at < now();
```

**Chat Messages**: Keep last 100 per user

```sql
DELETE FROM chat_messages cm1
WHERE cm1.id NOT IN (
    SELECT cm2.id
    FROM chat_messages cm2
    WHERE cm2.user_id = cm1.user_id
    ORDER BY cm2.created_at DESC
    LIMIT 100
);
```

**Cancelled Subscriptions**: Archive after 1 year of cancellation

```sql
-- Move to archive table (for compliance)
INSERT INTO subscriptions_archive
SELECT * FROM subscriptions
WHERE status = 'cancelled'
  AND cancelled_at < now() - interval '1 year';

DELETE FROM subscriptions
WHERE status = 'cancelled'
  AND cancelled_at < now() - interval '1 year';
```

---

## Backup & Disaster Recovery

### Supabase Backup Strategy

**Automated Backups**:

- **Daily**: Full database backup (retained for 7 days)
- **Hourly**: Point-in-time recovery (PITR) snapshots (retained for 7 days)

**Manual Backups** (before major schema changes):

```bash
pg_dump -h db.supabase.co -U postgres -d purple_glow_social > backup_$(date +%Y%m%d).sql
```

**Restore Process**:

1. Create new Supabase project
2. Restore from backup: `psql -h db.supabase.co -U postgres -d new_db < backup.sql`
3. Update DNS to point to new project
4. Verify data integrity

---

## Phase 1 Status

✅ Data model complete with 10 tables, relationships defined  
✅ Indexes optimized for query patterns  
✅ Row Level Security policies for POPIA compliance  
✅ Triggers for automation eligibility and tier limit enforcement  
✅ Views for aggregated queries (content calendar, analytics summary)  
✅ TypeScript type generation strategy documented  
✅ Validation schemas defined (Zod)  
✅ Data retention and backup strategies specified

**Next**: Generate API contracts (OpenAPI spec) and quickstart.md
