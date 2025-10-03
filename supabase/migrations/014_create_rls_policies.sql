-- Row Level Security (RLS) policies for POPIA compliance

-- Enable RLS on all tables
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

-- Users table policies
CREATE POLICY "Users can view own record" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own record" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Business profiles policies
CREATE POLICY "Users can view own business profile" ON business_profiles
    FOR SELECT USING (
        owner_user_id = auth.uid()
        OR id IN (SELECT business_profile_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can update own business profile" ON business_profiles
    FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY "Users can insert own business profile" ON business_profiles
    FOR INSERT WITH CHECK (owner_user_id = auth.uid());

-- Social media accounts policies
CREATE POLICY "Users can view own social accounts" ON social_media_accounts
    FOR SELECT USING (
        business_profile_id IN (
            SELECT id FROM business_profiles 
            WHERE owner_user_id = auth.uid() 
            OR id IN (SELECT business_profile_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can manage own social accounts" ON social_media_accounts
    FOR ALL USING (
        business_profile_id IN (SELECT id FROM business_profiles WHERE owner_user_id = auth.uid())
    );

-- Posts policies
CREATE POLICY "Users can view own posts" ON posts
    FOR SELECT USING (
        business_profile_id IN (
            SELECT id FROM business_profiles 
            WHERE owner_user_id = auth.uid() 
            OR id IN (SELECT business_profile_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can manage own posts" ON posts
    FOR ALL USING (
        business_profile_id IN (
            SELECT id FROM business_profiles 
            WHERE owner_user_id = auth.uid() 
            OR id IN (SELECT business_profile_id FROM users WHERE id = auth.uid())
        )
    );

-- Post publications policies
CREATE POLICY "Users can view own publications" ON post_publications
    FOR SELECT USING (
        post_id IN (
            SELECT id FROM posts WHERE business_profile_id IN (
                SELECT id FROM business_profiles 
                WHERE owner_user_id = auth.uid() 
                OR id IN (SELECT business_profile_id FROM users WHERE id = auth.uid())
            )
        )
    );

-- Analytics records policies
CREATE POLICY "Users can view own analytics" ON analytics_records
    FOR SELECT USING (
        post_publication_id IN (
            SELECT pp.id FROM post_publications pp
            JOIN posts p ON p.id = pp.post_id
            WHERE p.business_profile_id IN (
                SELECT id FROM business_profiles 
                WHERE owner_user_id = auth.uid() 
                OR id IN (SELECT business_profile_id FROM users WHERE id = auth.uid())
            )
        )
    );

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own subscription" ON subscriptions
    FOR UPDATE USING (user_id = auth.uid());

-- Billing transactions policies
CREATE POLICY "Users can view own transactions" ON billing_transactions
    FOR SELECT USING (
        subscription_id IN (SELECT id FROM subscriptions WHERE user_id = auth.uid())
    );

-- Chat messages policies
CREATE POLICY "Users can view own messages" ON chat_messages
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own messages" ON chat_messages
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admin policies (full access for admin users)
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND account_status = 'active')
    );

CREATE POLICY "Admins can view all business profiles" ON business_profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND account_status = 'active')
    );

CREATE POLICY "Admins can view all posts" ON posts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND account_status = 'active')
    );

CREATE POLICY "Admins can view all subscriptions" ON subscriptions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND account_status = 'active')
    );

CREATE POLICY "Admins can manage admin users" ON admin_users
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND admin_role = 'super_admin')
    );

COMMENT ON POLICY "Users can view own record" ON users IS 'RLS policy for POPIA compliance';
