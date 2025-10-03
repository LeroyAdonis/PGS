-- Admin users table: Administrator accounts with elevated privileges
CREATE TABLE admin_users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email varchar(255) NOT NULL UNIQUE,
    password_hash varchar(255) NOT NULL,
    display_name varchar(100) NOT NULL,
    admin_role varchar(20) NOT NULL CHECK (admin_role IN ('super_admin', 'support_admin', 'analyst')),
    account_status varchar(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended')),
    created_at timestamptz NOT NULL DEFAULT now(),
    last_login_at timestamptz
);

-- Create indexes for performance
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(admin_role);

COMMENT ON TABLE admin_users IS 'Stores administrator accounts with role-based access';
COMMENT ON COLUMN admin_users.admin_role IS 'super_admin, support_admin, analyst';
