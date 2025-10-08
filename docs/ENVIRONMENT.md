# Environment Configuration

This document explains all environment variables used in Purple Glow Social.

## Quick Setup

1. Copy `.env.example` to `.env.local`
2. Fill in your actual credentials
3. Never commit `.env.local` to version control

## Required Variables

### Supabase (Critical)

These are required for the app to function:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Where to find:**

- Dashboard → Settings → API
- Project URL and anon/public key

### Google Gemini API (AI Features)

Required for AI content generation:

```env
GOOGLE_GEMINI_API_KEY=your-api-key
```

**Where to get:**

- [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create a new API key

### Paystack (Payments)

Required for subscription payments:

```env
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...
```

**Where to get:**

- [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer)
- Settings → API Keys & Webhooks

## Social Media OAuth

### Facebook

```env
FACEBOOK_CLIENT_ID=your-app-id
FACEBOOK_CLIENT_SECRET=your-app-secret
FACEBOOK_REDIRECT_URI=https://your-project.supabase.co/functions/v1/oauth-callback/facebook
```

**Setup:**

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing
3. Add Facebook Login product
4. Set redirect URI in app settings

### Instagram

```env
INSTAGRAM_CLIENT_ID=your-client-id
INSTAGRAM_CLIENT_SECRET=your-client-secret
INSTAGRAM_ACCESS_TOKEN=your-access-token
```

**Setup:**

1. Instagram uses Facebook Graph API
2. Use same App ID/Secret as Facebook
3. Enable Instagram Basic Display in Facebook App
4. Generate access token

### Twitter/X

```env
TWITTER_CLIENT_ID=your-client-id
TWITTER_CLIENT_SECRET=your-client-secret
TWITTER_API_KEY=your-api-key
TWITTER_API_SECRET=your-api-secret
TWITTER_BEARER_TOKEN=your-bearer-token
```

**Setup:**

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app
3. Enable OAuth 2.0
4. Add callback URL
5. Generate keys and tokens

### LinkedIn

```env
LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret
```

**Setup:**

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create a new app
3. Request access to Sign In with LinkedIn
4. Add redirect URL
5. Copy Client ID and Secret

## Optional Services

### Unsplash (Stock Images)

```env
UNSPLASH_ACCESS_KEY=your-access-key
UNSPLASH_SECRET_KEY=your-secret-key
```

**Where to get:**

- [Unsplash Developers](https://unsplash.com/developers)
- Create a new application

### CopilotKit (AI Assistance)

```env
NEXT_PUBLIC_COPILOTKIT_PUBLIC_KEY=your-public-key
```

**Where to get:**

- [CopilotKit Dashboard](https://cloud.copilotkit.ai/)

### Google OAuth (User Authentication)

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

**Where to get:**

- [Google Cloud Console](https://console.cloud.google.com/)
- APIs & Services → Credentials
- Create OAuth 2.0 Client ID

## Security Variables

### Encryption & Secrets

```env
ENCRYPTION_KEY=your-encryption-key
INTERNAL_FUNCTION_SECRET=your-function-secret
FUNCTION_SECRET_KEY=your-secret-key
```

**Purpose:**

- `ENCRYPTION_KEY`: Encrypts sensitive data in database
- `INTERNAL_FUNCTION_SECRET`: Validates internal API calls
- `FUNCTION_SECRET_KEY`: Signs Edge Function requests

**How to generate:**

```bash
# Generate a secure random key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Supabase OAuth Callback URLs

For each social platform, configure these callback URLs in the respective developer portals:

- **Facebook**: `https://umklzllghajepovjlkcc.supabase.co/functions/v1/oauth-callback/facebook`
- **Instagram**: `https://umklzllghajepovjlkcc.supabase.co/functions/v1/oauth-callback/instagram`
- **Twitter**: `https://umklzllghajepovjlkcc.supabase.co/functions/v1/oauth-callback/twitter`
- **LinkedIn**: `https://umklzllghajepovjlkcc.supabase.co/functions/v1/oauth-callback/linkedin`

## Validation

The app automatically validates environment variables on startup. Run the dev server to check:

```bash
npm run dev
```

You'll see:

- ✅ All required environment variables are set
- ⚠️ Optional environment variables not set (if any)
- ❌ Missing required environment variables (with details)

## Environment Files

- `.env.local` - Your local development environment (DO NOT COMMIT)
- `.env.example` - Template file with placeholders (safe to commit)
- `.env.production` - Production environment (set in hosting platform)

## Troubleshooting

### "Missing required environment variables"

- Check that `.env.local` exists
- Verify all NEXT*PUBLIC*\* variables are set
- Restart dev server after changes

### OAuth not working

- Verify redirect URIs match exactly in platform settings
- Check that CLIENT_ID and CLIENT_SECRET are correct
- Ensure Edge Functions are deployed to Supabase

### Paystack payments failing

- Confirm using test keys in development
- Verify webhook URL is configured in Paystack dashboard
- Check that public key starts with `pk_test_` or `pk_live_`

## Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore` by default
2. **Use different keys for dev/prod** - Keep test and live credentials separate
3. **Rotate secrets regularly** - Especially after team members leave
4. **Limit key permissions** - Only grant necessary OAuth scopes
5. **Monitor API usage** - Watch for unexpected spikes that could indicate key compromise
