# Authentication and Onboarding Error Fix

## Problem Summary

The application was experiencing two critical errors:

1. **Login Error (400 Bad Request)**: User `testuser@example.com` couldn't log in
2. **Onboarding Error (401 Unauthorized)**: After login, creating business profile failed

## Root Cause

The application uses a **dual user management system**:

- **Supabase Auth (`auth.users`)**: Primary authentication system
- **Custom `users` table**: Stores additional user metadata (role, display_name, etc.)

The seed data was only creating users in the custom `users` table, not in Supabase Auth. This meant:

- Login failed because Supabase Auth didn't know about the test user
- Even if login worked, API routes requiring authentication would fail

## Solution

### 1. Added Trigger to Sync Auth Users (New Migration)

Created `supabase/migrations/017_sync_auth_users_trigger.sql` to automatically create a row in the custom `users` table when a user signs up via Supabase Auth.

### 2. Created Proper User Seeding Script

Created `scripts/seed-users.js` that uses Supabase Admin API to create users properly.

### 3. Added Package Script

Added `npm run db:seed-users` command to easily seed test users.

## How to Fix Your Environment

### Step 1: Set Up Environment Variables

1. Copy the template:

   ```bash
   cp .env.local.template .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`

### Step 2: Apply the New Migration

```bash
supabase db push
```

### Step 3: Seed Test Users

```bash
npm run db:seed-users
```

### Step 4: Start and Test

```bash
npm run dev
```

Then login with: `testuser@example.com` / `Test1234!`

## Files Modified

- `supabase/migrations/017_sync_auth_users_trigger.sql` - New migration
- `scripts/seed-users.js` - New seed script
- `package.json` - Added db:seed-users script
- `.env.local.template` - Environment template
