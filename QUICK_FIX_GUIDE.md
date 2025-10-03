# Quick Fix Guide for Login & Onboarding Errors

## 🚨 Problem

- Login returns `400 Bad Request`
- Onboarding returns `401 Unauthorized`

## ✅ Solution (5 Minutes)

### 1. Get Your Supabase Keys

Go to: https://supabase.com/dashboard/project/umklzllghajepovjlkcc/settings/api

Copy:

- **anon public** key
- **service_role** key (keep secret!)

### 2. Create .env.local File

```bash
cp .env.local.template .env.local
```

Edit `.env.local` and paste your keys:

```
NEXT_PUBLIC_SUPABASE_URL=https://umklzllghajepovjlkcc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-anon-key-here>
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key-here>
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Apply Migration

```bash
supabase db push
```

When prompted, confirm you want to push the migration `017_sync_auth_users_trigger.sql`.

### 4. Create Test Users

```bash
npm run db:seed-users
```

This creates:

- `testuser@example.com` / `Test1234!`
- `admin@purpleglowsocial.com` / `Admin1234!`

### 5. Start Dev Server

```bash
npm run dev
```

### 6. Test Login

Open http://localhost:3000/login and login with:

- Email: `testuser@example.com`
- Password: `Test1234!`

✅ Should redirect to dashboard

### 7. Test Onboarding

Open http://localhost:3000/onboarding

- Fill in business profile
- Submit

✅ Should create profile without 401 error

## 📖 Full Documentation

See `docs/AUTH_FIX_README.md` for:

- Technical details
- Troubleshooting
- Architecture explanation

## ❓ Still Having Issues?

1. Check `.env.local` has correct keys
2. Check browser console for errors
3. Check Supabase dashboard logs
4. Ensure migration was applied: `supabase db push --dry-run`
5. Re-run seed script: `npm run db:seed-users`
