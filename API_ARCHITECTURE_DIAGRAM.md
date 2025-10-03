# Purple Glow Social - API Architecture

## Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Client Application                            │
│                   (Next.js Frontend / Mobile App)                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ HTTP/HTTPS Request
                                 │ Authorization: Bearer <JWT>
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Next.js Middleware                               │
│                      (middleware.ts - Edge Runtime)                      │
├─────────────────────────────────────────────────────────────────────────┤
│  1. CORS Handler                                                         │
│     └─ OPTIONS preflight → 200 OK with CORS headers                    │
│     └─ Origin validation (production)                                   │
│                                                                          │
│  2. Rate Limiter (API routes only)                                      │
│     ├─ Check IP/user request count                                     │
│     ├─ Authenticated: 100 req/min                                       │
│     ├─ Unauthenticated: 10 req/min                                     │
│     └─ Exceeded? → 429 Too Many Requests                               │
│                                                                          │
│  3. Session Updater                                                      │
│     └─ Refresh Supabase session if needed                              │
│                                                                          │
│  4. Security Headers                                                     │
│     └─ Add CSP, HSTS, X-Frame-Options, etc.                            │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ Passed middleware checks
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API Route Handler                                │
│                   (app/api/v1/[category]/route.ts)                      │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Extract Request Data                                                 │
│     ├─ Parse JSON body                                                  │
│     ├─ Extract query params                                             │
│     └─ Extract route params                                             │
│                                                                          │
│  2. Authentication (Protected Routes)                                    │
│     ├─ Extract JWT from Authorization header                            │
│     ├─ Verify with Supabase Auth                                        │
│     ├─ Get user ID from token                                           │
│     └─ Unauthorized? → 401 Unauthorized                                 │
│                                                                          │
│  3. Validate Request (Zod Schema)                                        │
│     ├─ Parse body with Zod schema                                       │
│     ├─ Validate types, formats, constraints                             │
│     └─ Invalid? → 400 Bad Request (RFC 7807)                           │
│                                                                          │
│  4. Authorization Check                                                  │
│     ├─ Verify resource ownership                                        │
│     ├─ Check admin role (if required)                                   │
│     └─ Forbidden? → 403 Forbidden                                       │
│                                                                          │
│  5. Business Logic                                                       │
│     ├─ Check subscription limits                                        │
│     ├─ Call service functions                                           │
│     ├─ External API calls (Gemini, Paystack, social)                   │
│     └─ Database operations                                              │
│                                                                          │
│  6. Error Handling                                                       │
│     ├─ Catch exceptions                                                 │
│     ├─ Log error with context                                           │
│     └─ Return RFC 7807 Problem Details                                  │
│                                                                          │
│  7. Response                                                             │
│     └─ Return JSON with appropriate status code                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ Response with security headers
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Client Application                              │
│                      (Process response / Handle error)                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Service Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           API Route Handlers                             │
│                          (app/api/v1/**/*.ts)                            │
└────────────┬────────────────────────────────────────────────┬───────────┘
             │                                                 │
             │ Uses                                            │ Uses
             │                                                 │
┌────────────▼──────────────┐                  ┌──────────────▼────────────┐
│   Service Layer (lib/)    │                  │  Middleware (lib/middleware)│
├───────────────────────────┤                  ├────────────────────────────┤
│ • gemini/                 │                  │ • rate-limit.ts            │
│   ├─ text-generation.ts   │                  │ • cors.ts                  │
│   └─ image-generation.ts  │                  └────────────────────────────┘
│                           │
│ • paystack/               │
│   ├─ client.ts            │                  ┌────────────────────────────┐
│   ├─ subscriptions.ts     │                  │  Validation (lib/validation)│
│   └─ webhooks.ts          │                  ├────────────────────────────┤
│                           │                  │ • user.ts                  │
│ • social-media/           │                  │ • business-profile.ts      │
│   ├─ facebook.ts          │◄─────Uses───────┤ • post.ts                  │
│   ├─ instagram.ts         │                  │ • social-account.ts        │
│   ├─ twitter.ts           │                  │ • subscription.ts          │
│   └─ linkedin.ts          │                  │ • common.ts                │
│                           │                  └────────────────────────────┘
│ • supabase/               │
│   ├─ server.ts            │
│   ├─ client.ts            │                  ┌────────────────────────────┐
│   └─ middleware.ts        │                  │  Error Handling            │
│                           │                  │  (lib/errors/)             │
│ • errors/                 │                  ├────────────────────────────┤
│   ├─ handler.ts           │                  │ • handler.ts               │
│   └─ types.ts             │                  │ • types.ts                 │
│                           │                  │   ├─ AppError              │
│ • logging/                │                  │   ├─ ValidationError       │
│   └─ logger.ts            │                  │   ├─ UnauthorizedError     │
└───────────┬───────────────┘                  │   ├─ NotFoundError         │
            │                                   │   └─ ProblemDetails        │
            │ Connects to                       └────────────────────────────┘
            │
┌───────────▼───────────────────────────────────────────────────────────┐
│                         External Services                              │
├────────────────────────────────────────────────────────────────────────┤
│  • Supabase (Database, Auth, Storage)                                  │
│  • Google Gemini API (AI Text & Image Generation)                      │
│  • Paystack (Payment Processing)                                       │
│  • Facebook Graph API                                                  │
│  • Instagram Graph API                                                 │
│  • Twitter API v2                                                      │
│  • LinkedIn Marketing API                                              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Database Architecture (Supabase PostgreSQL)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           users (Supabase Auth)                          │
│  • id (uuid, PK)                                                         │
│  • email (text, unique)                                                  │
│  • display_name (text)                                                   │
│  • is_admin (boolean)                                                    │
└──────────────┬──────────────────────────────────────────────────────────┘
               │
               │ 1:1
               │
┌──────────────▼──────────────────────────────────────────────────────────┐
│                        business_profiles                                 │
│  • id (uuid, PK)                                                         │
│  • owner_user_id (uuid, FK → users.id)                                   │
│  • business_name, industry, target_audience                              │
│  • tone, language, topics                                                │
│  • automation_enabled, automation_eligible_at                            │
└──────────────┬──────────────────────────────────────────────────────────┘
               │
               │ 1:N
               │
┌──────────────▼──────────────────────────────────────────────────────────┐
│                      social_media_accounts                               │
│  • id (uuid, PK)                                                         │
│  • business_profile_id (uuid, FK → business_profiles.id)                 │
│  • platform (facebook, instagram, twitter, linkedin)                     │
│  • platform_account_id, platform_username                                │
│  • encrypted_access_token (encrypted with pgcrypto)                      │
│  • token_expires_at, connection_status                                   │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                              posts                                        │
│  • id (uuid, PK)                                                         │
│  • business_profile_id (uuid, FK → business_profiles.id)                 │
│  • caption, hashtags, image_url                                          │
│  • status (pending, approved, rejected, scheduled, published, failed)    │
│  • platform_targets (array: facebook, instagram, twitter, linkedin)      │
│  • scheduled_time, published_at                                          │
│  • generation_prompt, user_edits (JSONB)                                 │
└──────────────┬──────────────────────────────────────────────────────────┘
               │
               │ 1:N
               │
┌──────────────▼──────────────────────────────────────────────────────────┐
│                       post_publications                                  │
│  • id (uuid, PK)                                                         │
│  • post_id (uuid, FK → posts.id)                                         │
│  • platform (facebook, instagram, twitter, linkedin)                     │
│  • status (publishing, published, failed)                                │
│  • platform_post_id, platform_post_url                                   │
│  • error_message, retry_count                                            │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                       analytics_records                                  │
│  • id (uuid, PK)                                                         │
│  • post_id (uuid, FK → posts.id)                                         │
│  • platform (facebook, instagram, twitter, linkedin)                     │
│  • likes, comments, shares, reach, impressions                           │
│  • engagement_rate (calculated)                                          │
│  • collected_at (timestamp)                                              │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                          subscriptions                                   │
│  • id (uuid, PK)                                                         │
│  • owner_user_id (uuid, FK → users.id)                                   │
│  • tier (starter, growth, enterprise)                                    │
│  • status (trial, pending_payment, active, cancelled, expired)           │
│  • posts_limit, posts_used_current_cycle                                 │
│  • paystack_customer_code, paystack_subscription_code                    │
│  • next_billing_date, cancelled_at                                       │
└──────────────┬──────────────────────────────────────────────────────────┘
               │
               │ 1:N
               │
┌──────────────▼──────────────────────────────────────────────────────────┐
│                      billing_transactions                                │
│  • id (uuid, PK)                                                         │
│  • subscription_id (uuid, FK → subscriptions.id)                         │
│  • owner_user_id (uuid, FK → users.id)                                   │
│  • paystack_reference, amount, currency (ZAR)                            │
│  • status (pending, completed, failed)                                   │
│  • transaction_type (subscription_payment, upgrade)                      │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                         chat_messages                                    │
│  • id (uuid, PK)                                                         │
│  • user_id (uuid, FK → users.id)                                         │
│  • message_text, message_role (user, assistant)                          │
│  • context (JSONB)                                                       │
│  • created_at                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

**Row Level Security (RLS) Policies:**
- All tables enforce `owner_user_id = auth.uid()` for user data
- Admin tables check `is_admin = true` in users table
- Read-only access for analytics (no UPDATE/DELETE)

---

## Authentication Flow

```
┌────────────────────┐
│  1. Registration   │
└────────┬───────────┘
         │ POST /api/v1/auth/register
         │ { email, password, displayName }
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  Supabase Auth                                                  │
│  • Create user account                                          │
│  • Hash password (bcrypt)                                       │
│  • Send verification email                                      │
│  • Generate JWT tokens (access + refresh)                       │
└────────┬───────────────────────────────────────────────────────┘
         │
         │ Returns { user, session: { access_token, refresh_token } }
         │
         ▼
┌────────────────────┐
│  2. Login          │
└────────┬───────────┘
         │ POST /api/v1/auth/login
         │ { email, password }
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  Supabase Auth                                                  │
│  • Verify credentials                                           │
│  • Generate new JWT tokens                                      │
│  • Set session cookies                                          │
└────────┬───────────────────────────────────────────────────────┘
         │
         │ Returns { user, session: { access_token, refresh_token } }
         │
         ▼
┌────────────────────┐
│  3. API Requests   │
└────────┬───────────┘
         │ Authorization: Bearer <access_token>
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  API Route Handler                                              │
│  • Extract token from header                                    │
│  • Verify with Supabase: supabase.auth.getUser()               │
│  • Extract user.id from token                                   │
│  • Use user.id for database queries (RLS enforced)              │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────┐
│  4. Token Refresh  │
└────────┬───────────┘
         │ POST /api/v1/auth/refresh
         │ { refresh_token }
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  Supabase Auth                                                  │
│  • Validate refresh token                                       │
│  • Generate new access token                                    │
│  • Rotate refresh token (if needed)                             │
└────────┬───────────────────────────────────────────────────────┘
         │
         │ Returns { session: { access_token, refresh_token } }
         │
         ▼
┌────────────────────┐
│  5. Logout         │
└────────┬───────────┘
         │ POST /api/v1/auth/logout
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  Supabase Auth                                                  │
│  • Invalidate session                                           │
│  • Clear cookies                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## AI Content Generation Flow

```
┌────────────────────┐
│  User Request      │
│  "Create a post    │
│   about coffee"    │
└────────┬───────────┘
         │
         │ POST /api/v1/posts
         │ { businessProfileId, topic: "coffee", platforms: ["instagram"] }
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  API Route: POST /posts                                         │
│  1. Validate request (Zod)                                      │
│  2. Check subscription limits (posts_used < posts_limit)        │
│  3. Get business profile (tone, language, topics, audience)     │
└────────┬───────────────────────────────────────────────────────┘
         │
         │ Call lib/gemini/text-generation.ts
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  Google Gemini 1.5 Pro (Text Generation)                        │
│  Prompt:                                                         │
│  "You are a social media content creator for [business_name].   │
│   Generate a post about [topic] with tone: [tone]               │
│   Target audience: [target_audience]                            │
│   Language: [language]                                          │
│   Platform: [platform]                                          │
│   Include 3-10 relevant hashtags."                              │
└────────┬───────────────────────────────────────────────────────┘
         │
         │ Returns: { caption, hashtags }
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  Extract image prompt from caption                              │
│  (First sentence or key visual description)                     │
└────────┬───────────────────────────────────────────────────────┘
         │
         │ Call lib/gemini/image-generation.ts
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  Google Gemini 2.5 Flash Image Preview                          │
│  Prompt: "Generate a professional image for social media:       │
│           [image_prompt]"                                       │
└────────┬───────────────────────────────────────────────────────┘
         │
         │ Returns: base64 image data
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  Upload to Supabase Storage                                     │
│  Bucket: post-images                                            │
│  Path: {business_profile_id}/{post_id}.png                      │
│  Public URL: https://[project].supabase.co/storage/v1/...       │
└────────┬───────────────────────────────────────────────────────┘
         │
         │ Store in database
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  Insert into posts table                                        │
│  • id, business_profile_id, caption, hashtags, image_url        │
│  • status: 'pending' (requires approval)                        │
│  • generation_prompt, platform_targets                          │
│  • created_at                                                   │
└────────┬───────────────────────────────────────────────────────┘
         │
         │ Increment subscription.posts_used_current_cycle
         │
         ▼
┌────────────────────┐
│  Return post       │
│  to user           │
│  Status: pending   │
└────────────────────┘
```

---

## Publishing Flow

```
┌────────────────────┐
│  User Approves     │
│  Post              │
└────────┬───────────┘
         │ POST /api/v1/posts/{id}/approve
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  Update post status: 'pending' → 'approved'                     │
│  Increment business_profile.approved_posts_count                │
│  Check automation eligibility (≥10 approvals + 14 days)         │
└────────┬───────────────────────────────────────────────────────┘
         │
         │ User schedules or publishes
         │
         ▼
┌────────────────────┐         ┌─────────────────────┐
│  POST /schedule    │   OR    │  POST /publish      │
│  { scheduled_time }│         │  (immediate)        │
└────────┬───────────┘         └────────┬────────────┘
         │                              │
         │ Status: 'approved' →         │ Status: 'approved' →
         │         'scheduled'          │         'publishing'
         │                              │
         │ (Cron job picks up)          │ (Publish now)
         │                              │
         └──────────────┬───────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────────┐
│  For each platform in platform_targets:                         │
│  1. Get social_media_account                                    │
│  2. Decrypt access token                                        │
│  3. Call platform API (lib/social-media/[platform].ts)          │
│  4. Create post_publications record                             │
└────────┬───────────────────────────────────────────────────────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         │              │              │              │
         ▼              ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Facebook   │  │  Instagram  │  │  Twitter    │  │  LinkedIn   │
│  Graph API  │  │  Graph API  │  │  API v2     │  │  Marketing  │
│             │  │             │  │             │  │  API        │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │                │
       │ Returns        │ Returns        │ Returns        │ Returns
       │ post_id        │ media_id       │ tweet_id       │ urn_id
       │                │                │                │
       └────────────────┴────────────────┴────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────────┐
│  Update post_publications records                               │
│  • status: 'publishing' → 'published' (or 'failed')             │
│  • platform_post_id, platform_post_url                          │
│  • error_message (if failed)                                    │
│  • published_at                                                 │
└────────┬───────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  Update post status                                             │
│  • All published? → status: 'published'                         │
│  • Some failed? → status: 'published' (check publications)      │
│  • All failed? → status: 'failed'                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Error Response Format (RFC 7807)

```json
{
  "type": "https://api.purpleglowsocial.co.za/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "The request body contains invalid data.",
  "instance": "/api/v1/posts",
  "errors": {
    "caption": ["Caption is required", "Caption must be at least 10 characters"],
    "platform_targets": ["At least one platform must be selected"]
  }
}
```

**Error Type URIs:**
- `/errors/validation-error` (400)
- `/errors/unauthorized` (401)
- `/errors/forbidden` (403)
- `/errors/not-found` (404)
- `/errors/conflict` (409)
- `/errors/rate-limit-exceeded` (429)
- `/errors/internal-server-error` (500)

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 1: Network (Vercel Edge)                                          │
│  • DDoS protection                                                       │
│  • TLS 1.3 encryption                                                    │
│  • HTTPS enforcement                                                     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│  Layer 2: Middleware (Next.js)                                           │
│  • Rate limiting (100/10 req/min)                                        │
│  • CORS origin validation                                                │
│  • Security headers (CSP, HSTS, X-Frame-Options)                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│  Layer 3: API Routes (Route Handlers)                                    │
│  • JWT authentication                                                    │
│  • Request validation (Zod)                                              │
│  • Authorization checks                                                  │
│  • Error sanitization                                                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│  Layer 4: Database (Supabase)                                            │
│  • Row Level Security (RLS)                                              │
│  • Encrypted connections (SSL)                                           │
│  • Token encryption (pgcrypto)                                           │
│  • Parameterized queries                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Vercel Platform                               │
│                          (Serverless Edge)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Edge Middleware (middleware.ts)                                  │  │
│  │  • CORS, Rate Limiting, Security Headers                          │  │
│  │  • Runs on every request (global)                                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  API Route Functions (Serverless)                                 │  │
│  │  • app/api/v1/** (32 route handlers)                              │  │
│  │  • Auto-scales based on traffic                                   │  │
│  │  • Cold start: <100ms                                             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Static Assets (CDN)                                              │  │
│  │  • Next.js frontend                                               │  │
│  │  • Global edge caching                                            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────┬───────────────────────────────────────────────────────┘
                  │
                  │ Connects to
                  │
┌─────────────────▼───────────────────────────────────────────────────────┐
│                        External Services                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  • Supabase (us-east-1): Database, Auth, Storage                        │
│  • Google Gemini API: AI Text & Image Generation                        │
│  • Paystack: Payment Processing (South Africa)                          │
│  • Social Platforms: Facebook, Instagram, Twitter, LinkedIn             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Application Logs                                │
│                        (lib/logging/logger.ts)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  • API requests (method, path, status, duration)                        │
│  • Authentication events (login, logout, token refresh)                 │
│  • Rate limit hits                                                      │
│  • AI generation requests                                               │
│  • Publishing attempts                                                  │
│  • Webhook events                                                       │
│  • Error stack traces (with context)                                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ Streamed to
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                      Monitoring Platforms                                │
│  • Vercel Analytics (performance, traffic)                              │
│  • Sentry (error tracking) - configured but not deployed                │
│  • Supabase Dashboard (database metrics)                                │
│  • Custom health check monitoring (GET /api/v1/health)                  │
└─────────────────────────────────────────────────────────────────────────┘

Key Metrics to Monitor:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• API Response Time (p50, p95, p99)
• Error Rate (% of 5xx responses)
• Rate Limit Hit Rate (% of 429 responses)
• Database Query Latency
• AI Generation Success Rate
• Publishing Success Rate (per platform)
• Webhook Processing Time
• Active Subscriptions
• Storage Usage (per user)
```

---

**END OF ARCHITECTURE DIAGRAM**
