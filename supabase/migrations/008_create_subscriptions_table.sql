-- Subscriptions table: Subscription tier and billing information
CREATE TABLE subscriptions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL UNIQUE,
    tier varchar(20) NOT NULL CHECK (tier IN ('starter', 'growth', 'enterprise')),
    status varchar(20) NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
    billing_cycle_start date NOT NULL,
    next_billing_date date NOT NULL,
    trial_end_date date,
    payment_method_token varchar(255),
    paystack_customer_id varchar(255),
    paystack_subscription_id varchar(255),
    posts_used_current_cycle integer NOT NULL DEFAULT 0,
    posts_limit integer NOT NULL,
    platforms_connected integer NOT NULL DEFAULT 0,
    platforms_limit integer NOT NULL,
    team_members_count integer NOT NULL DEFAULT 1,
    team_members_limit integer NOT NULL,
    storage_used_mb numeric(10,2) NOT NULL DEFAULT 0,
    storage_limit_mb integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    cancelled_at timestamptz,
    CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);
CREATE INDEX idx_subscriptions_trial_end ON subscriptions(trial_end_date);

COMMENT ON TABLE subscriptions IS 'Stores subscription tier and usage counters';
COMMENT ON COLUMN subscriptions.posts_limit IS 'Monthly post limit (30/120/9999 for unlimited)';
COMMENT ON COLUMN subscriptions.platforms_limit IS 'Max platforms (2/4/4)';
COMMENT ON COLUMN subscriptions.team_members_limit IS 'Max team members (1/3/10)';
COMMENT ON COLUMN subscriptions.storage_limit_mb IS 'Storage limit in MB (2048/10240/51200)';
