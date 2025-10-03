-- Social media accounts table: OAuth connections to social platforms
CREATE TABLE social_media_accounts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_profile_id uuid NOT NULL,
    platform varchar(20) NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin')),
    platform_user_id varchar(255) NOT NULL,
    platform_username varchar(255) NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    token_expires_at timestamptz NOT NULL,
    connection_status varchar(20) NOT NULL DEFAULT 'connected' CHECK (connection_status IN ('connected', 'expired', 'revoked', 'error')),
    last_sync_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_social_accounts_business_profile FOREIGN KEY (business_profile_id) 
        REFERENCES business_profiles(id) ON DELETE CASCADE
);

-- Prevent duplicate connections
ALTER TABLE social_media_accounts ADD CONSTRAINT uniq_platform_account 
    UNIQUE (business_profile_id, platform, platform_user_id);

-- Create indexes for performance
CREATE INDEX idx_social_accounts_business_profile ON social_media_accounts(business_profile_id);
CREATE INDEX idx_social_accounts_token_expiry ON social_media_accounts(token_expires_at);
CREATE INDEX idx_social_accounts_status ON social_media_accounts(connection_status);

COMMENT ON TABLE social_media_accounts IS 'Stores OAuth connections with encrypted tokens';
COMMENT ON COLUMN social_media_accounts.access_token IS 'Encrypted OAuth access token (use pgcrypto in application layer)';
COMMENT ON COLUMN social_media_accounts.refresh_token IS 'Encrypted OAuth refresh token (if supported)';
