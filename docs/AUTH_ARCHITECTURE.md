# Authentication Architecture

## Dual User Management System

Purple Glow Social uses a dual user management system combining Supabase Auth with a custom users table.

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Registration Flow                       │
└─────────────────────────────────────────────────────────────────┘

    Client                 Next.js API              Supabase Auth        Database
      │                        │                          │                 │
      │  POST /auth/register   │                          │                 │
      ├───────────────────────>│                          │                 │
      │                        │  supabase.auth.signUp()  │                 │
      │                        ├─────────────────────────>│                 │
      │                        │                          │                 │
      │                        │                          │  Create user in │
      │                        │                          │  auth.users     │
      │                        │                          ├────────────────>│
      │                        │                          │                 │
      │                        │     User + Session       │                 │
      │                        │<─────────────────────────┤                 │
      │                        │                          │                 │
      │                        │                          │   🔥 TRIGGER    │
      │                        │                          │  Automatically  │
      │                        │                          │  creates row in │
      │                        │                          │  public.users   │
      │                        │                          │<────────────────┤
      │                        │                          │                 │
      │                        │  Insert custom metadata  │                 │
      │                        │  (role, display_name)    │                 │
      │                        ├──────────────────────────┼────────────────>│
      │                        │                          │                 │
      │   User + Session       │                          │                 │
      │<───────────────────────┤                          │                 │
      │                        │                          │                 │
```

## Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Login Flow                           │
└─────────────────────────────────────────────────────────────────┘

    Client                 Next.js API              Supabase Auth        Database
      │                        │                          │                 │
      │  POST /auth/login      │                          │                 │
      │  {email, password}     │                          │                 │
      ├───────────────────────>│                          │                 │
      │                        │  signInWithPassword()    │                 │
      │                        ├─────────────────────────>│                 │
      │                        │                          │                 │
      │                        │                          │  Verify in      │
      │                        │                          │  auth.users     │
      │                        │                          ├────────────────>│
      │                        │                          │                 │
      │                        │     User + Session       │                 │
      │                        │<─────────────────────────┤                 │
      │                        │                          │                 │
      │                        │  Fetch custom metadata   │                 │
      │                        │  SELECT * FROM users     │                 │
      │                        ├──────────────────────────┼────────────────>│
      │                        │                          │                 │
      │                        │   role, display_name,    │                 │
      │                        │   notification_prefs     │                 │
      │                        │<─────────────────────────┼─────────────────┤
      │                        │                          │                 │
      │   Combined user data   │                          │                 │
      │   + session            │                          │                 │
      │<───────────────────────┤                          │                 │
      │                        │                          │                 │
```

## Authenticated API Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  Protected API Request Flow                      │
└─────────────────────────────────────────────────────────────────┘

    Client              Middleware           API Route            Supabase Auth
      │                     │                    │                      │
      │  POST /api/v1/      │                    │                      │
      │  business-profiles  │                    │                      │
      │  (with cookies)     │                    │                      │
      ├────────────────────>│                    │                      │
      │                     │                    │                      │
      │                     │  updateSession()   │                      │
      │                     │  Refresh tokens    │                      │
      │                     ├────────────────────┼─────────────────────>│
      │                     │                    │                      │
      │                     │  Updated cookies   │                      │
      │                     │<───────────────────┼──────────────────────┤
      │                     │                    │                      │
      │                     │   Continue to API  │                      │
      │                     ├───────────────────>│                      │
      │                     │                    │                      │
      │                     │                    │  getUser()           │
      │                     │                    ├─────────────────────>│
      │                     │                    │                      │
      │                     │                    │  ✅ Valid session    │
      │                     │                    │  User ID             │
      │                     │                    │<─────────────────────┤
      │                     │                    │                      │
      │                     │                    │  Process request     │
      │                     │                    │  with user context   │
      │                     │                    │                      │
      │                     │   Response         │                      │
      │<────────────────────┼────────────────────┤                      │
      │                     │                    │                      │
```

## Database Schema

### auth.users (Managed by Supabase)

```sql
auth.users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  encrypted_password VARCHAR,
  email_confirmed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  last_sign_in_at TIMESTAMP,
  raw_user_meta_data JSONB,  -- Stores display_name, role
  ...
)
```

### public.users (Custom Application Table)

```sql
public.users (
  id UUID PRIMARY KEY,              -- Same as auth.users.id
  email VARCHAR UNIQUE,
  display_name VARCHAR,
  role VARCHAR,                     -- user, business_admin, admin
  account_status VARCHAR,           -- active, suspended, deleted
  email_verified BOOLEAN,
  notification_preferences JSONB,
  business_profile_id UUID,
  created_at TIMESTAMP,
  last_login_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Why Dual System?

### Supabase Auth Handles:

- ✅ Password hashing (bcrypt)
- ✅ Email verification
- ✅ Session management (JWT)
- ✅ OAuth integrations (Google, Facebook, etc.)
- ✅ Password reset
- ✅ Multi-factor authentication
- ✅ Security best practices

### Custom Users Table Adds:

- ✅ Application-specific roles
- ✅ Business logic (account status)
- ✅ Custom user preferences
- ✅ Relationships to business data
- ✅ Team member management
- ✅ Soft delete capability

## Synchronization Strategy

### During Registration (Automatic)

1. User signs up via `/api/v1/auth/register`
2. Supabase creates user in `auth.users`
3. **Trigger automatically creates row in `public.users`**
4. API route can add additional metadata if needed

### During Login (Manual Fetch)

1. User logs in via `/api/v1/auth/login`
2. Supabase validates credentials
3. **API route manually fetches from `public.users`**
4. Combined data returned to client

### Edge Cases

**User exists in auth.users but not public.users:**

- Trigger should handle this automatically
- Fallback: Seed script uses UPSERT to ensure sync

**User exists in public.users but not auth.users:**

- This shouldn't happen (violation of foreign key constraint)
- Old seed data issue - fixed by new seed script

## Migration: 017_sync_auth_users_trigger.sql

```sql
-- Automatically create public.users row when auth user is created
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
        COALESCE(NEW.raw_user_meta_data->>'display_name',
                 split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        'active',
        NEW.email_confirmed_at IS NOT NULL,
        NEW.created_at,
        '{"email_enabled": true, "in_app_enabled": true,
          "events": ["post_published", "analytics_ready"]}'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        email_verified = EXCLUDED.email_verified;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

## Key Takeaways

1. **Never insert directly into `public.users` without creating in `auth.users` first**
2. **Use the seed script (`npm run db:seed-users`) to create test users**
3. **The trigger keeps tables in sync for new signups**
4. **Login fetches from both sources to get complete user data**
5. **Session cookies are managed by Supabase automatically**

## Testing Checklist

- [ ] Can register a new user via UI
- [ ] Trigger creates row in `public.users` automatically
- [ ] Can log in with registered user
- [ ] Session persists across page refreshes
- [ ] Protected API routes work after login
- [ ] Can create business profile (onboarding)
- [ ] Logout clears session properly
