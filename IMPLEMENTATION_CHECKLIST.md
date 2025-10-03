# Implementation Checklist for Auth/Onboarding Fix

## ✅ Status: Ready for Testing

All code changes have been implemented. Follow these steps to apply the fix to your environment.

---

## Step-by-Step Implementation

### Prerequisites

- [ ] You have access to Supabase dashboard
- [ ] You have the Supabase CLI installed (`supabase --version`)
- [ ] You have Node.js 20+ installed (`node -v`)

---

### Step 1: Get Supabase Credentials (5 minutes)

1. Go to: https://supabase.com/dashboard/project/umklzllghajepovjlkcc/settings/api

2. Copy these two keys:
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`) ⚠️ Keep this secret!

---

### Step 2: Set Up Environment File (2 minutes)

```bash
# In your project root (PGS/)
cp .env.local.template .env.local
```

Edit `.env.local` and paste your keys:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://umklzllghajepovjlkcc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-your-anon-key-here>
SUPABASE_SERVICE_ROLE_KEY=<paste-your-service-role-key-here>
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

Save the file.

---

### Step 3: Apply Database Migration (3 minutes)

This migration adds a trigger to automatically sync `auth.users` with the custom `users` table.

```bash
supabase db push
```

**Expected output:**

```
Do you want to push these migrations to the remote database?
 • 017_sync_auth_users_trigger.sql

 [Y/n] y
Applying migration 017_sync_auth_users_trigger.sql...
✅ Migration applied successfully
```

If you see an error about the trigger already existing, that's OK - it means the migration was already applied.

---

### Step 4: Seed Test Users (2 minutes)

This creates users in both `auth.users` and `public.users` tables.

```bash
npm run db:seed-users
```

**Expected output:**

```
🌱 Seeding test users...

Creating user: testuser@example.com...
  ✅ Created auth user (id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  ✅ Created custom user record

Creating user: admin@purpleglowsocial.com...
  ✅ Created auth user (id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  ✅ Created custom user record

✅ User seeding complete!

Test Accounts:
  👤 User: testuser@example.com
  🔑 Password: Test1234!

  👨‍💼 Admin: admin@purpleglowsocial.com
  🔑 Password: Admin1234!
```

If you see "User already exists", that's OK - the script will update the existing records.

---

### Step 5: Start Development Server (1 minute)

```bash
npm run dev
```

**Expected output:**

```
▲ Next.js 14.2.0
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.3s
```

---

### Step 6: Test Login (2 minutes)

1. Open your browser: http://localhost:3000/login

2. Enter credentials:
   - Email: `testuser@example.com`
   - Password: `Test1234!`

3. Click "Sign In"

**✅ Success:** You should be redirected to http://localhost:3000/dashboard

**❌ If it fails:**

- Check browser console for errors
- Verify `.env.local` has correct keys
- Check Supabase dashboard logs: https://supabase.com/dashboard/project/umklzllghajepovjlkcc/logs/explorer

---

### Step 7: Test Onboarding (3 minutes)

1. Log out (if logged in)

2. Open: http://localhost:3000/onboarding

3. Log in with test user credentials

4. Fill in the business profile form:
   - Business Name: `Test Business`
   - Industry: `Technology`
   - Target Audience: `Developers and tech enthusiasts`
   - Tone: `Professional`
   - Topics: `AI, Development, Testing`
   - Language: `English`

5. Click "Next"

**✅ Success:** Form submits and you proceed to Step 2 (Social Media)

**❌ If you get 401 Unauthorized:**

- Check that you're logged in (look for session cookies in DevTools)
- Check `.env.local` has correct keys
- Re-run the seed script: `npm run db:seed-users`
- Check browser console for detailed error messages

---

## Verification Checklist

After completing all steps, verify:

- [ ] Login works with `testuser@example.com` / `Test1234!`
- [ ] Dashboard loads after login
- [ ] Can access onboarding flow
- [ ] Business profile creation succeeds (no 401 error)
- [ ] User session persists across page refreshes
- [ ] Can log out successfully

---

## Common Issues and Solutions

### Issue: "Missing Supabase environment variables"

**Cause:** `.env.local` file doesn't exist or has incorrect format

**Solution:**

```bash
cp .env.local.template .env.local
# Edit and add your actual keys
```

---

### Issue: "User already exists" during seed

**Cause:** Test users were already created in a previous run

**Solution:** This is expected and OK. The script updates existing users.

---

### Issue: Still getting 401 on onboarding

**Cause:** Session might not be properly established

**Solutions to try:**

1. Clear browser cookies and cache
2. Check Application > Cookies in DevTools for `sb-` prefixed cookies
3. Re-login with test user
4. Check that middleware is running (look for security headers in Network tab)

---

### Issue: Migration fails with "trigger already exists"

**Cause:** Migration was already applied in a previous run

**Solution:** This is OK - the trigger is already in place

---

### Issue: Can't connect to Supabase

**Cause:** Network issue or wrong URL

**Solution:**

- Verify URL: `https://umklzllghajepovjlkcc.supabase.co`
- Check Supabase project is active in dashboard
- Try: `curl https://umklzllghajepovjlkcc.supabase.co/rest/v1/`

---

## Additional Resources

- **Quick Fix Guide:** `QUICK_FIX_GUIDE.md`
- **Detailed Documentation:** `docs/AUTH_FIX_README.md`
- **Architecture Diagram:** `docs/AUTH_ARCHITECTURE.md`
- **Supabase Dashboard:** https://supabase.com/dashboard/project/umklzllghajepovjlkcc

---

## Next Steps After Fix

Once login and onboarding work:

1. Test other features (post generation, analytics, etc.)
2. Add more test users if needed
3. Configure social media OAuth (Facebook, Instagram, X, LinkedIn)
4. Set up Paystack for billing
5. Deploy to production (see README.md deployment section)

---

## Support

If you encounter issues not covered here:

1. Check browser console for errors
2. Check Next.js server logs in terminal
3. Check Supabase logs in dashboard
4. Review the detailed docs in `docs/AUTH_FIX_README.md`
5. Verify all steps in this checklist were completed

---

**Last Updated:** 2024-10-03
**Status:** ✅ Ready for implementation
