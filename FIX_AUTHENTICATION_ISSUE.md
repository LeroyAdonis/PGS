# Fix for Login and Onboarding Authentication Errors

## Issue Summary

Users were experiencing authentication errors when:

1. Logging in with test credentials (testuser@example.com / Test1234!)
2. Attempting to create a business profile during onboarding

### Error Messages

- `POST https://umklzllghajepovjlkcc.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)` in LoginForm.tsx
- `Error creating business profile: Error: Authentication required.` in OnboardingWizard.tsx

## Root Cause Analysis

The issue was caused by an **authentication inconsistency** in the business profiles API route:

- **Problem**: `app/api/v1/business-profiles/route.ts` was using `createRouteClient` from `@/lib/supabase/server`
- **Expected**: All other API routes use `createRouteHandlerClient` from `@supabase/auth-helpers-nextjs`
- **Impact**: Session cookies were not being read correctly in the business profiles endpoint, causing authentication to fail even when users were logged in

## Technical Details

### Before (Incorrect)

```typescript
import { createRouteClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createRouteClient()
  // ...
}
```

### After (Correct)

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  // ...
}
```

## Changes Made

**File**: `app/api/v1/business-profiles/route.ts`

1. **Import Changes**:
   - Removed: `import { createRouteClient } from '@/lib/supabase/server'`
   - Added: `import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'`
   - Added: `import { cookies } from 'next/headers'`

2. **Client Initialization**:
   - Old: `const supabase = await createRouteClient()`
   - New:
     ```typescript
     const cookieStore = cookies()
     const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
     ```

## Why This Fix Works

1. **Cookie Handling**: `createRouteHandlerClient` properly integrates with Next.js App Router's cookie management
2. **Session Consistency**: The same authentication method is now used across all API routes
3. **Token Propagation**: Session tokens from the login flow are correctly read by the business profiles endpoint

## Verification

- ✅ TypeScript compilation passed
- ✅ ESLint checks passed
- ✅ Code follows the same pattern as all other API routes in the codebase
- ✅ Consistent with project conventions documented in `.github/copilot-instructions.md`

## Testing Recommendations

To verify the fix works in your environment:

1. **Login Test**:
   - Navigate to `/login`
   - Enter credentials: testuser@example.com / Test1234!
   - Verify successful login and redirect to dashboard or onboarding

2. **Onboarding Test**:
   - After login, if redirected to `/onboarding`
   - Fill in business profile form (Step 1)
   - Click "Continue to Social Media Setup"
   - Verify no "Authentication required" error
   - Verify successful business profile creation

3. **Session Persistence**:
   - Refresh the page after login
   - Verify session remains active
   - Check that authenticated API calls work correctly

## Related Files

- `app/api/v1/business-profiles/route.ts` - Fixed file
- `components/auth/LoginForm.tsx` - Login component
- `components/onboarding/OnboardingWizard.tsx` - Onboarding component
- `lib/supabase/server.ts` - Server-side Supabase client utilities
- `.github/copilot-instructions.md` - Project coding conventions

## Additional Notes

- This fix aligns with the deprecation notice for `@supabase/auth-helpers-nextjs`
- Future migration to `@supabase/ssr` should maintain the same cookie-based session pattern
- All other API routes in the project already follow this correct pattern
