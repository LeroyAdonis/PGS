# Purple Glow Social API - Quick Start Guide

**For Developers:** Get up and running with the API in 5 minutes.

---

## 🚀 Quick Setup

### 1. Prerequisites

```bash
# Required
node >= 18.x
npm >= 9.x

# Optional for local development
Supabase CLI
Docker (for local Supabase)
```

### 2. Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

**Required variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_GEMINI_API_KEY=your_gemini_key
PAYSTACK_SECRET_KEY=your_paystack_secret
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Install & Run

```bash
npm install
npm run dev
```

API available at: `http://localhost:3000/api/v1`

---

## 🔑 Authentication

### Register User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "displayName": "John Doe",
    "acceptTerms": true
  }'
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe"
  },
  "session": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_at": 1704292800
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Use Access Token

```bash
curl http://localhost:3000/api/v1/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📝 Create Your First Post

### 1. Create Business Profile

```bash
curl -X POST http://localhost:3000/api/v1/business-profiles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "My Coffee Shop",
    "industry": "Food & Beverage",
    "targetAudience": "Coffee lovers, ages 25-45",
    "tone": "friendly",
    "language": "en",
    "topics": ["coffee", "local business", "community"]
  }'
```

### 2. Connect Social Account

```bash
# Get OAuth URL
curl -X POST http://localhost:3000/api/v1/social-accounts/connect/facebook \
  -H "Authorization: Bearer YOUR_TOKEN"

# Returns:
{
  "authUrl": "https://facebook.com/oauth/authorize?..."
}

# User clicks URL, authorizes, redirects back to:
# http://localhost:3000/api/v1/social-accounts/callback/facebook?code=...
```

### 3. Generate AI Post

```bash
curl -X POST http://localhost:3000/api/v1/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessProfileId": "YOUR_PROFILE_ID",
    "topic": "Our new holiday blend",
    "platformTargets": ["facebook", "instagram"]
  }'
```

**Response:**
```json
{
  "post": {
    "id": "uuid",
    "caption": "🎄☕ Introducing our Holiday Blend! Warm, spiced, and perfect for cozy winter mornings...",
    "hashtags": "#HolidayBlend #CoffeeShop #WinterVibes #LocalCoffee",
    "imageUrl": "https://supabase.co/storage/v1/.../image.png",
    "status": "pending",
    "platformTargets": ["facebook", "instagram"],
    "createdAt": "2025-01-03T10:00:00Z"
  }
}
```

### 4. Approve & Publish

```bash
# Approve
curl -X POST http://localhost:3000/api/v1/posts/{POST_ID}/approve \
  -H "Authorization: Bearer YOUR_TOKEN"

# Publish immediately
curl -X POST http://localhost:3000/api/v1/posts/{POST_ID}/publish \
  -H "Authorization: Bearer YOUR_TOKEN"

# OR schedule for later
curl -X POST http://localhost:3000/api/v1/posts/{POST_ID}/schedule \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledTime": "2025-01-03T18:00:00Z"
  }'
```

---

## 📊 View Analytics

### Get Post Analytics

```bash
curl http://localhost:3000/api/v1/analytics/posts/{POST_ID} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "postId": "uuid",
  "analytics": [
    {
      "platform": "facebook",
      "likes": 45,
      "comments": 8,
      "shares": 12,
      "reach": 1250,
      "engagementRate": 5.2
    },
    {
      "platform": "instagram",
      "likes": 89,
      "comments": 15,
      "shares": 0,
      "reach": 2100,
      "engagementRate": 4.9
    }
  ],
  "totalEngagement": 169,
  "totalReach": 3350
}
```

### Get Summary

```bash
curl "http://localhost:3000/api/v1/analytics/summary?fromDate=2025-01-01&toDate=2025-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🛠️ Common Operations

### List Posts

```bash
# All posts
curl "http://localhost:3000/api/v1/posts" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filtered
curl "http://localhost:3000/api/v1/posts?status=published&platform=instagram" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Post

```bash
curl -X PUT http://localhost:3000/api/v1/posts/{POST_ID} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "Updated caption text",
    "hashtags": "#NewHashtag #Updated"
  }'
```

### Regenerate Image

```bash
curl -X POST http://localhost:3000/api/v1/posts/{POST_ID}/regenerate-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imagePrompt": "A cozy coffee shop interior with holiday decorations"
  }'
```

### Get Subscription Status

```bash
curl http://localhost:3000/api/v1/subscriptions/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "subscription": {
    "id": "uuid",
    "tier": "starter",
    "status": "active",
    "postsLimit": 30,
    "postsUsed": 12,
    "platformsLimit": 2,
    "platformsConnected": 2,
    "nextBillingDate": "2025-02-01",
    "amount": 499,
    "currency": "ZAR"
  }
}
```

---

## ⚡ Rate Limits

- **Authenticated:** 100 requests/minute
- **Unauthenticated:** 10 requests/minute

**Rate limit headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704292800
```

**429 Response:**
```json
{
  "type": "/errors/rate-limit-exceeded",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "Too many requests. Please try again in 45 seconds.",
  "retryAfter": 45
}
```

---

## 🚨 Error Handling

All errors follow **RFC 7807 Problem Details** format:

```json
{
  "type": "/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Validation failed",
  "instance": "/api/v1/posts",
  "errors": {
    "caption": ["Caption is required"],
    "platformTargets": ["At least one platform must be selected"]
  }
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `204` - No Content (logout, delete)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (email already exists)
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

---

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

### Health Check

```bash
curl http://localhost:3000/api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-03T10:30:00Z",
  "version": "1.0.0",
  "uptime": 86400,
  "services": {
    "database": {
      "status": "healthy",
      "latency": 42
    }
  }
}
```

---

## 📚 API Reference

### Endpoints

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Auth** | 4 | Registration, login, logout, refresh |
| **Profiles** | 4 | Business profile management |
| **Social** | 4 | Connect Facebook, Instagram, Twitter, LinkedIn |
| **Posts** | 8 | Create, read, update, delete, approve, reject |
| **Publishing** | 3 | Schedule, publish, get status |
| **Analytics** | 3 | Post metrics, summary, top posts |
| **Subscriptions** | 4 | Get, upgrade, cancel, billing history |
| **Chat** | 2 | AI assistant conversation |
| **Admin** | 3 | User management, system metrics |
| **Health** | 1 | System health status |

**Total:** 36 endpoints

Full API specification: `specs/001-purple-glow-social/contracts/openapi.yaml`

---

## 🔒 Security Best Practices

### 1. Store Tokens Securely

```typescript
// ❌ Don't store in localStorage
localStorage.setItem('token', accessToken)

// ✅ Use httpOnly cookies (handled by Supabase)
// OR secure session storage with encryption
```

### 2. Refresh Tokens

```typescript
// Refresh before expiry
if (expiresAt - Date.now() < 5 * 60 * 1000) { // 5 min before
  await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken })
  })
}
```

### 3. Handle Errors

```typescript
try {
  const response = await fetch('/api/v1/posts', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  
  if (!response.ok) {
    const error = await response.json()
    // Handle RFC 7807 error
    console.error(error.title, error.detail)
  }
  
  const data = await response.json()
} catch (error) {
  console.error('Network error:', error)
}
```

### 4. Implement Retry Logic

```typescript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
        await sleep(retryAfter * 1000)
        continue
      }
      
      return response
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await sleep(1000 * Math.pow(2, i)) // Exponential backoff
    }
  }
}
```

---

## 🐛 Troubleshooting

### Issue: "Invalid signature" on webhook

**Cause:** Paystack webhook secret mismatch

**Solution:**
1. Check `PAYSTACK_WEBHOOK_SECRET` in `.env.local`
2. Verify webhook URL in Paystack dashboard
3. Test with Paystack's webhook testing tool

### Issue: "Rate limit exceeded"

**Cause:** Too many requests in 1 minute

**Solution:**
1. Implement exponential backoff
2. Cache responses where appropriate
3. Check `X-RateLimit-Reset` header for reset time

### Issue: "Unauthorized" on protected endpoint

**Cause:** Missing, expired, or invalid JWT token

**Solution:**
1. Verify token is included: `Authorization: Bearer TOKEN`
2. Check token expiry
3. Refresh token if needed
4. Re-login if refresh token expired

### Issue: AI generation timeout

**Cause:** Gemini API slow or down

**Solution:**
1. Check Google Cloud Console for Gemini API status
2. Retry request after delay
3. Implement timeout handling (max 30 seconds)

---

## 📞 Support

- **Documentation:** `PHASE_3.4_COMPLETION_REPORT.md`
- **Architecture:** `API_ARCHITECTURE_DIAGRAM.md`
- **OpenAPI Spec:** `specs/001-purple-glow-social/contracts/openapi.yaml`
- **Issues:** GitHub Issues
- **Email:** support@purpleglowsocial.com

---

## 🚀 Next Steps

1. **Complete onboarding:** Create business profile, connect social accounts
2. **Generate first post:** Use AI to create content
3. **Publish content:** Schedule or publish immediately
4. **Track analytics:** Monitor engagement metrics
5. **Upgrade plan:** Scale to Growth or Enterprise tier

---

**Happy Building! 🎉**
