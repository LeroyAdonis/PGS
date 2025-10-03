-- Users table: Individual user accounts (business owners, team members)
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email varchar(255) NOT NULL UNIQUE,
    password_hash varchar(255),
    display_name varchar(100) NOT NULL,
    role varchar(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'business_admin', 'team_member')),
    account_status varchar(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted')),
    email_verified boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_login_at timestamptz,
    notification_preferences jsonb NOT NULL DEFAULT '{}',
    business_profile_id uuid
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_business_profile_id ON users(business_profile_id);
CREATE INDEX idx_users_account_status ON users(account_status);

COMMENT ON TABLE users IS 'Stores individual user accounts with role-based access';
COMMENT ON COLUMN users.password_hash IS 'Hashed password (NULL for OAuth-only users)';
COMMENT ON COLUMN users.notification_preferences IS 'JSON: {email_enabled, in_app_enabled, events: [...]}';
