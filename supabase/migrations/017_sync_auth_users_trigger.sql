-- Trigger to sync auth.users with custom users table
-- This ensures that when a user signs up via Supabase Auth,
-- a corresponding row is created in the custom users table

-- Function to handle new user creation in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        display_name,
        role,
        account_status,
        email_verified,
        created_at,
        notification_preferences
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        'active',
        NEW.email_confirmed_at IS NOT NULL,
        NEW.created_at,
        '{
            "email_enabled": true,
            "in_app_enabled": true,
            "events": ["post_published", "analytics_ready", "billing_reminder"]
        }'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        email_verified = EXCLUDED.email_verified;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
-- Note: This requires Supabase to allow triggers on auth schema
-- For safety, we'll create this as a webhook handler instead
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a row in public.users when a user signs up via Supabase Auth';
