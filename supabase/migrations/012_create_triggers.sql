-- Database triggers for automation and data integrity

-- Trigger 1: Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at column
CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON business_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_media_accounts_updated_at BEFORE UPDATE ON social_media_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger 2: Check automation eligibility after post approval
CREATE OR REPLACE FUNCTION check_automation_eligibility()
RETURNS TRIGGER AS $$
DECLARE
    v_business_profile business_profiles%ROWTYPE;
    v_account_age interval;
BEGIN
    -- Only check when post is approved
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        SELECT * INTO v_business_profile
        FROM business_profiles
        WHERE id = NEW.business_profile_id;

        -- Increment approved posts counter
        UPDATE business_profiles
        SET approved_posts_count = approved_posts_count + 1
        WHERE id = NEW.business_profile_id
        RETURNING * INTO v_business_profile;

        -- Check eligibility: 10 posts + 14 days active
        v_account_age := now() - v_business_profile.created_at;

        IF v_business_profile.approved_posts_count >= 10
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

CREATE TRIGGER check_posts_automation_eligibility AFTER INSERT OR UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION check_automation_eligibility();

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically update updated_at timestamp on row modifications';
COMMENT ON FUNCTION check_automation_eligibility() IS 'Update automation_eligible_at when user approves 10th post and account is 14+ days old';
