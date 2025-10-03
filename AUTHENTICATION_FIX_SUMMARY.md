# Authentication Fix Summary

## Problem Statement

Users were experiencing authentication errors during onboarding:

1. Error: "Authentication required" when creating business profile
2. Users couldn't sign out from onboarding page to try again
3. Unable to return to landing page - always redirected back to onboarding

## Root Causes Identified

1. **Missing credentials in fetch calls**: API requests to `/api/v1/business-profiles` were not including credentials (cookies), causing authentication to fail even when users were logged in.

2. **Incomplete logout implementation**: The UserMenu logout function only redirected to login without actually clearing the Supabase session, leaving users in a stuck state.

3. **No logout option in onboarding**: Users stuck in onboarding had no way to sign out and try with different credentials.

## Solutions Implemented

### 1. Fixed UserMenu Logout (components/dashboard/UserMenu.tsx)

**Before:**

```typescript
const handleLogout = () => {
  // TODO: Implement logout logic
  // For now, redirect to login
  window.location.href = '/login'
}
```

**After:**

```typescript
const handleLogout = async () => {
  try {
    await supabase.auth.signOut()
    router.push('/login')
  } catch (error) {
    console.error('Error signing out:', error)
    window.location.href = '/login'
  }
}
```

### 2. Added Credentials to API Calls

**OnboardingWizard.tsx:**

```typescript
const response = await fetch('/api/v1/business-profiles', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // ← Added this
  body: JSON.stringify(data),
})
```

**Step2SocialConnect.tsx:**

```typescript
const response = await fetch(`/api/v1/social-accounts/connect/${platform}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // ← Added this
  body: JSON.stringify({
    businessProfileId,
    redirectUri: `${window.location.origin}/onboarding`,
  }),
})
```

### 3. Added Sign-Out Button to Onboarding Page

Added a clearly visible "Sign Out" button at the top of the onboarding page:

```typescript
<div className="flex justify-between items-center mb-6">
    <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
    <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        className="flex items-center gap-2"
    >
        <LogOut className="h-4 w-4" />
        Sign Out
    </Button>
</div>
```

### 4. Made TopNav a Client Component

Added `'use client'` directive to TopNav.tsx to support client-side routing and state management needed for the UserMenu.

## Files Changed

1. `components/dashboard/UserMenu.tsx` - Fixed logout to clear Supabase session
2. `components/dashboard/TopNav.tsx` - Added 'use client' directive
3. `components/onboarding/OnboardingWizard.tsx` - Added credentials to fetch, added sign-out button
4. `components/onboarding/Step2SocialConnect.tsx` - Added credentials to fetch
5. `tests/unit/components/onboarding.test.tsx` - Added tests for new functionality

## Testing

All OnboardingWizard tests pass (5/5):

- ✅ Renders the first step initially
- ✅ Renders sign out button
- ✅ Handles sign out when button is clicked
- ✅ Navigates to second step after completing first step
- ✅ Completes onboarding and verifies credentials in API call

## How to Verify the Fix

### 1. Test Logout Functionality

1. Log in to the application
2. Navigate to the dashboard
3. Click on your user menu in the top right
4. Click "Logout"
5. **Expected**: You should be redirected to `/login` and your session should be cleared
6. **Expected**: If you try to access `/dashboard` again, you should be redirected to login

### 2. Test Onboarding Authentication

1. Register a new user or log in with existing credentials
2. If redirected to `/onboarding`, fill out the business profile form
3. Click "Continue to Social Media Setup"
4. **Expected**: No "Authentication required" error
5. **Expected**: Business profile should be created successfully
6. **Expected**: You should proceed to Step 2 (Social Media Connect)

### 3. Test Sign-Out from Onboarding

1. Log in and navigate to `/onboarding`
2. Look for the "Sign Out" button at the top right of the page
3. Click "Sign Out"
4. **Expected**: You should be redirected to `/login`
5. **Expected**: Your session should be cleared
6. **Expected**: You can now log in with different credentials

### 4. Test API Authentication

1. Open browser DevTools (F12) → Network tab
2. Log in and navigate to onboarding
3. Fill out the business profile form and submit
4. In Network tab, find the request to `/api/v1/business-profiles`
5. **Expected**: Request should include cookies
6. **Expected**: Response should be 201 Created (not 401 Unauthorized)

## Technical Details

### Why `credentials: 'include'` is Important

By default, `fetch()` does not include credentials (cookies) in cross-origin requests. Even for same-origin requests in some configurations, cookies might not be sent automatically. Adding `credentials: 'include'` ensures that:

1. HTTP-only session cookies are sent with the request
2. Supabase can validate the user's authentication token
3. The API route can access the user's session via `supabase.auth.getUser()`

### Why the Previous Fix Wasn't Complete

The previous fix (documented in `FIX_AUTHENTICATION_ISSUE.md`) addressed the API route using the correct Supabase client initialization, but didn't address:

1. The client-side fetch calls missing credentials
2. The logout functionality not clearing sessions
3. Users being stuck in onboarding without a way to sign out

## Next Steps

After merging this PR:

1. Deploy to staging environment
2. Test with real Supabase instance
3. Verify no regression in existing authentication flows
4. Monitor for any 401 errors in production logs

## Related Documentation

- Previous fix: `FIX_AUTHENTICATION_ISSUE.md`
- Project conventions: `.github/copilot-instructions.md`
- API documentation: `specs/001-purple-glow-social/contracts/openapi.yaml`
