# Research: Purple Glow Social

**Date**: October 8, 2025
**Feature**: 001-purple-glow-social
**Phase**: 0 - Outline & Research

## Overview

This document consolidates research findings to resolve all "NEEDS CLARIFICATION" items from the Technical Context section of the implementation plan. Each section addresses specific unknowns, evaluates alternatives, and provides concrete decisions with rationale.

## 1. Testing Framework Selection

### Decision: Vitest + Playwright

**Rationale**:

- **Vitest** for unit and integration tests:

  - Native ESM support aligns with Next.js 15 App Router
  - Built-in TypeScript support without configuration
  - Compatible with Vite ecosystem (future-proof)
  - Faster than Jest with similar API (migration-friendly)
  - Better support for modern React features (Server Components)

- **Playwright** for E2E tests:
  - Chrome Dev Tools MCP requirement for data scraping suggests Playwright compatibility
  - Better cross-browser support than Cypress
  - Native TypeScript support
  - Excellent debugging tools and trace viewer
  - More reliable for testing OAuth flows and external integrations

**Alternatives Considered**:

- **Jest + Testing Library**: Industry standard but slower, requires babel config, less optimal for Next.js 15
- **Cypress**: Great for E2E but limited browser support, more challenging for complex auth flows
- **Testing Library alone**: Insufficient for E2E requirements

**Implementation Notes**:

- Use Vitest for: Zod schema validation, utility functions, API route handlers, AI service mocks
- Use Playwright for: User flows, OAuth integration, payment flows, social media posting
- Chrome Dev Tools MCP integration for admin lead insights scraping

## 2. Caching Strategy

### Decision: Supabase Edge Function Cache + Client-side React Query

**Rationale**:

- **Supabase Edge Functions** with built-in caching:

  - Cache AI-generated content at edge for faster retrieval
  - Cache social media API responses (rate limit protection)
  - Geographic distribution (closer to South African users)
  - No additional infrastructure (aligned with constitution: avoid complexity)

- **TanStack Query (React Query v5)** for client state:
  - Cache user data, business profiles, and content locally
  - Optimistic updates for better UX
  - Background refetching for real-time analytics
  - Built-in retry and error handling

**Alternatives Considered**:

- **Redis (Upstash)**: Excellent but adds infrastructure complexity, overkill for MVP
- **Local-only caching**: Insufficient for API rate limit management
- **Supabase Realtime**: Better for live updates but not general caching

**Implementation Notes**:

- Cache durations:
  - AI-generated content: 5 minutes (allows quick regeneration)
  - Social media API responses: 15 minutes (respect rate limits)
  - User/business profiles: 1 hour (infrequent changes)
  - Analytics data: 5 minutes (balance freshness vs API calls)
- Cache keys include user ID and business ID for proper isolation
- Implement cache invalidation on content approval/edit

## 3. Google Gemini API Rate Limits & Quota Management

### Decision: Implement tiered rate limiting with graceful degradation

**Research Findings**:

Google Gemini API rate limits (as of October 2025):

- **Gemini 1.5 Pro** (text generation):

  - Free tier: 15 requests/minute, 1 million tokens/day
  - Paid tier: 360 requests/minute, unlimited tokens
  - Rate limit: 2 requests/second per user

- **Gemini 2.5 Flash** (gemini-2.5-flash-image-preview):
  - Free tier: 15 requests/minute
  - Paid tier: 360 requests/minute
  - Image generation typically slower (10-30 seconds)

**Rationale**:

- Start with paid tier to ensure service reliability
- Implement per-user rate limiting to prevent abuse
- Queue system for burst traffic handling
- Fallback strategies for quota exhaustion

**Implementation Strategy**:

1. **Request Queuing**:

   - Use Supabase Edge Function with Durable Objects for queue management
   - Priority queue: manual requests > scheduled posts > background regeneration

2. **Rate Limit Enforcement**:

   - Track requests per user per subscription tier
   - Starter: 10 posts/month = ~0.33 posts/day = conservative usage
   - Growth: 50 posts/month = ~1.67 posts/day
   - Enterprise: Unlimited but with fair use policy (100/day soft limit)

3. **Graceful Degradation**:

   - If text generation fails: retry with exponential backoff (3 attempts)
   - If image generation fails: proceed with text-only post, notify user
   - If quota exhausted: queue for next available window, notify user

4. **Cost Management**:
   - Monitor API costs per subscription tier
   - Alert when costs exceed revenue thresholds
   - Implement emergency circuit breaker at 2x projected costs

**Alternatives Considered**:

- **Free tier**: Insufficient for multi-tenant SaaS, unpredictable reliability
- **Multiple API keys rotation**: Against ToS, unnecessary complexity
- **Alternative AI providers**: Would violate constitution's technology stack

## 4. Social Media API Rate Limits

### Decision: Implement per-platform rate limit tracking with staggered posting

**Research Findings**:

| Platform                | Rate Limits (per user token)                                    | Notes                                      |
| ----------------------- | --------------------------------------------------------------- | ------------------------------------------ |
| **Facebook Pages API**  | 200 calls/hour/user                                             | Covers both Facebook & Instagram Graph API |
| **Instagram Graph API** | 200 calls/hour/user                                             | Shared limit with Facebook                 |
| **Twitter/X API v2**    | 50 posts/24hrs (Free), 300 posts/24hrs (Basic), unlimited (Pro) | Strict posting limits                      |
| **LinkedIn API**        | 100 posts/day/member, throttled to avoid spam                   | Sliding window                             |

**Rationale**:

- Different platforms have vastly different limits
- Must track per-user, per-platform usage
- Posting failures should not cascade across platforms

**Implementation Strategy**:

1. **Rate Limit Tracking Table**:

   ```sql
   CREATE TABLE api_rate_limits (
     user_id UUID,
     platform TEXT,
     window_start TIMESTAMPTZ,
     calls_made INTEGER,
     calls_limit INTEGER,
     reset_at TIMESTAMPTZ
   );
   ```

2. **Staggered Posting**:

   - When scheduling posts to multiple platforms, space them 2 minutes apart
   - Reduces burst API usage and appears more organic
   - Prevents all-or-nothing failures

3. **Token Health Monitoring**:

   - Check rate limit headers on every API response
   - Proactively pause posting if approaching limit
   - Alert user when token refresh needed (FR-008)

4. **Fallback Strategy**:
   - If platform rate limit hit: queue post for next available window
   - If token invalid: immediately notify user (FR-008b), preserve post
   - If platform-specific failure: continue posting to other platforms (FR-008c)

**Alternatives Considered**:

- **Ignore rate limits**: Would cause failures and poor user experience
- **Single global rate limit**: Over-restrictive, wastes available quota
- **Paid API tiers for all platforms**: Too expensive for user base, Twitter/X Pro not justified

## 5. Real-Time Features Architecture

### Decision: Supabase Realtime + Server-Sent Events (SSE)

**Rationale**:

- **Supabase Realtime** for database changes:

  - Built-in, no additional infrastructure
  - WebSocket-based pub/sub
  - Real-time updates for content approval status, analytics refresh
  - Row Level Security applies to subscriptions

- **Server-Sent Events (SSE)** for AI generation progress:
  - Simpler than WebSockets for one-way server-to-client
  - Native browser support, automatic reconnection
  - Perfect for streaming AI generation updates ("Generating post 1 of 3...")
  - Better for progress indicators and loading states

**Use Cases**:

1. **Supabase Realtime**:

   - Content approval status changes
   - New posts generated by scheduled jobs
   - Analytics data updates
   - Social media post publishing status
   - Confidence score updates

2. **Server-Sent Events**:

   - AI text generation progress ("Analyzing business profile...")
   - AI image generation progress ("Generating brand image...")
   - Batch content generation progress

3. **Push Notifications** (via Supabase Edge Functions + FCM):
   - OAuth token expiration/revocation alerts (FR-008b)
   - Scheduled post failures
   - Subscription billing events
   - Critical system alerts

**Implementation Notes**:

- CopilotKit chat interface will use REST API with SSE for streaming responses
- Real-time subscriptions scoped per user/business to prevent data leaks
- Fallback to polling every 30 seconds if WebSocket connection fails
- No WebSockets for CopilotKit chat (REST + SSE sufficient for agent workflow)

**Alternatives Considered**:

- **WebSockets everywhere**: Overkill, more complex, harder to scale
- **Polling only**: Poor UX for progress indicators, higher server load
- **Third-party real-time service (Pusher, Ably)**: Adds cost and complexity unnecessarily

## 6. Concurrent User & Database Capacity Planning

### Decision: Start with Supabase Pro plan, scale based on metrics

**Initial Capacity Targets**:

- **Concurrent Users**: 100 active users initially (realistic launch target)
- **Database Size**: 10GB initial allocation
- **Connection Pooling**: PgBouncer with 20 max connections
- **API Requests**: 50,000/day initially (~500 users at 100 requests/day each)

**Rationale**:

- Conservative launch estimates based on:

  - 30-day free trial conversion target: 40% of signups
  - Estimated 50-100 signups in first month (marketing dependent)
  - Service-based SMB market in South Africa relatively small initially

- Supabase Pro Plan ($25/month) includes:
  - 8GB database
  - 50GB bandwidth
  - 500,000 monthly active users (sufficient headroom)
  - Daily backups
  - Point-in-time recovery

**Scaling Triggers**:

- Upgrade to Team plan ($599/month) when:
  - Database > 8GB
  - Concurrent connections consistently > 15
  - API response time p95 > 500ms
  - Monthly active users > 500

**Database Size Projections**:

| Entity                  | Est. Size per Record | Records (100 users) | Total Size |
| ----------------------- | -------------------- | ------------------- | ---------- |
| Users                   | 2KB                  | 100                 | 200KB      |
| Business Profiles       | 5KB                  | 100                 | 500KB      |
| Posts (generated)       | 3KB                  | 5,000 (50/user)     | 15MB       |
| Analytics Data          | 1KB                  | 10,000              | 10MB       |
| Brand Assets (metadata) | 2KB                  | 200                 | 400KB      |
| Social Accounts         | 1KB                  | 400 (4/user)        | 400KB      |
| Subscriptions           | 1KB                  | 100                 | 100KB      |
| **Total**               |                      |                     | **~27MB**  |

- Images stored in Supabase Storage (not database): ~50MB per user on average
- First 100 users: ~5GB storage (well within limits)

**Alternatives Considered**:

- **Supabase Free Tier**: Insufficient, no daily backups, pauses after inactivity
- **Self-hosted PostgreSQL**: Against constitution (complexity), requires DevOps
- **Dedicated server**: Premature optimization, expensive

## 7. UI Screen Count & Design System

### Decision: ~18 core screens using Shadcn UI + Purple Glow theme

**Screen Inventory**:

**Authentication (3 screens)**:

1. Login
2. Signup
3. OAuth Callback

**Onboarding (4 screens)**:

4. Welcome / Intro
5. Business Information
6. Brand Identity Upload
7. Social Media Connection

**Main Application (7 screens)**:

8. Dashboard (content overview)
9. Content Calendar
10. Content Approval/Editor
11. Analytics Dashboard
12. Settings - Profile
13. Settings - Business
14. Settings - Social Accounts
15. Settings - Billing & Subscription

**Admin (3 screens)**:

16. Admin Dashboard
17. Lead Insights Tool
18. Platform Analytics

**Additional (1 screen)**:

19. Marketing Landing Page (public)

**Design System Implementation**:

- **Shadcn UI Components**: Pre-built, accessible, customizable
- **Purple Glow Theme**: Custom Tailwind configuration
  - Primary: Purple variations (#8B5CF6 family)
  - Accent: Complementary glow effects
  - Dark mode support (user preference)

**Rationale**:

- Shadcn UI provides:
  - Type-safe component library
  - Copy-paste architecture (no external dependencies)
  - Full design control (not a black box)
  - Excellent accessibility defaults

**Alternatives Considered**:

- **Material UI**: Too opinionated, harder to customize
- **Chakra UI**: Good but heavier bundle size
- **Custom components from scratch**: Unnecessary wheel reinvention

## 8. Background Job Architecture

### Decision: Supabase Edge Functions + pg_cron for scheduled tasks

**Scheduled Jobs Required**:

1. **Post Publishing** (runs every minute):

   - Query posts where `scheduled_at <= NOW() AND status = 'scheduled'`
   - Publish to respective social platforms via API
   - Update status to 'published' or 'failed'
   - Implement retry logic (3 attempts with exponential backoff)

2. **OAuth Token Refresh** (runs every hour):

   - Check tokens expiring within 24 hours
   - Refresh using platform-specific refresh token
   - Update stored access token
   - Alert user if refresh fails (FR-008b)

3. **Analytics Sync** (runs every 4 hours):

   - Fetch engagement metrics from social platforms
   - Update analytics_data table
   - Calculate performance trends
   - Trigger Supabase Realtime updates for live dashboard

4. **Confidence Score Calculation** (runs daily at midnight):
   - Analyze user edit patterns from past 30 days
   - Calculate confidence score per business
   - Update business_profiles table
   - Trigger automation prompt if threshold reached (FR-012a)

**Implementation**:

```sql
-- Using pg_cron extension in Supabase
SELECT cron.schedule(
  'publish-scheduled-posts',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://[project-ref].supabase.co/functions/v1/publish-posts',
    headers := '{"Authorization": "Bearer [anon-key]"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'refresh-oauth-tokens',
  '0 * * * *', -- Every hour
  $$ ... $$
);
```

**Rationale**:

- **pg_cron**: Native PostgreSQL extension, reliable, no external dependencies
- **Edge Functions**: Stateless, scalable, geographic distribution
- **Supabase native**: Aligned with constitution (avoid complexity)

**Alternatives Considered**:

- **Vercel Cron Jobs**: Limited to 1/day on hobby, requires Pro plan
- **External cron service**: Adds dependency, security concerns
- **Custom polling service**: Unnecessary complexity

## 9. South African Language Support Implementation

### Decision: Google Gemini multilingual prompts + language detection

**11 Official Languages**:

1. Afrikaans
2. English
3. isiNdebele
4. isiXhosa
5. isiZulu
6. Sesotho
7. Setswana
8. Sepedi
9. siSwati
10. Tshivenda
11. Xitsonga

**Implementation Strategy**:

1. **User Language Selection**:

   - Business profile includes `preferred_languages[]` field
   - User selects primary and optional secondary languages
   - Content tone selection (professional, friendly, humorous) per language

2. **Gemini Prompt Engineering**:

   ```typescript
   const systemPrompt = `
   Generate social media content for a ${business.industry} business in South Africa.
   Language: ${business.preferredLanguage}
   Tone: ${business.tone}

   IMPORTANT:
   - Use natural ${language} language
   - Include relevant South African cultural references
   - Use local slang and idioms where appropriate
   - Reference local events when relevant
   - Ensure authenticity for South African audience

   Business: ${business.name}
   Services: ${business.services}
   Target audience: ${business.targetAudience}
   ```

3. **Cultural Context Database**:

   - Maintain JSON file of South African cultural references
   - Public holidays, major events, local trends
   - Region-specific content (Gauteng vs Western Cape vs KZN)
   - Update quarterly with community input

4. **Language Quality Assurance**:
   - Confidence score includes language quality feedback
   - User can flag cultural inappropriateness
   - Learn from corrections to improve future generation

**Rationale**:

- Google Gemini has strong multilingual capabilities including all SA languages
- Authenticity is core differentiator (Constitution Article II)
- Cultural relevance drives engagement (SC-005, SC-006)

**Alternatives Considered**:

- **Translation API**: Would feel inauthentic, literal translations miss cultural context
- **Pre-written templates per language**: Too rigid, doesn't scale with AI learning
- **English only**: Violates constitution, misses market opportunity

## 10. Development Environment & Prerequisites

### Decision: Standardized local development setup with Docker optional

**Required Software**:

- Node.js 20+ (LTS)
- pnpm 8+ (faster than npm/yarn, better monorepo support)
- Git 2.40+
- Supabase CLI (for local development)
- VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Error Translator

**Development Modes**:

1. **Cloud Development** (fastest to start):

   - Connect to hosted Supabase project
   - No local database setup required
   - Shared development environment

2. **Local Development** (full isolation):
   - Supabase Local with Docker
   - Local PostgreSQL instance
   - Local Edge Functions testing

**Environment Variables Required**:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Gemini
GEMINI_API_KEY=

# Social Media APIs
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
TWITTER_API_KEY=
TWITTER_API_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# Paystack
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=

# App Configuration
NEXT_PUBLIC_APP_URL=
NODE_ENV=
```

**Rationale**:

- pnpm for workspace management (faster installs, better caching)
- Supabase CLI for local development parity
- Docker optional (not required, respects developer preference)

**Alternatives Considered**:

- **npm/yarn**: Slower, less efficient disk usage
- **Mandatory Docker**: Barrier to entry for some developers
- **Remote-only development**: Slower feedback loop, connectivity dependent

## Summary of Decisions

| Category            | Decision                                       | Status      |
| ------------------- | ---------------------------------------------- | ----------- |
| Testing Framework   | Vitest + Playwright                            | ✅ Resolved |
| Caching Strategy    | Supabase Edge Cache + React Query              | ✅ Resolved |
| Gemini Rate Limits  | Paid tier, tiered limits, graceful degradation | ✅ Resolved |
| Social API Limits   | Per-platform tracking, staggered posting       | ✅ Resolved |
| Real-Time           | Supabase Realtime + SSE                        | ✅ Resolved |
| Capacity Planning   | Supabase Pro, 100 users initial, 10GB DB       | ✅ Resolved |
| UI Screens          | 18 screens, Shadcn UI + Purple Glow theme      | ✅ Resolved |
| Background Jobs     | pg_cron + Supabase Edge Functions              | ✅ Resolved |
| SA Language Support | Gemini multilingual prompts + cultural context | ✅ Resolved |
| Dev Environment     | Node 20+, pnpm, Supabase CLI, Docker optional  | ✅ Resolved |

## Next Steps

All "NEEDS CLARIFICATION" items from Technical Context have been resolved. Proceed to Phase 1: Design & Contracts.

- Generate data-model.md with entity definitions
- Create API contracts in /contracts/
- Document quickstart.md with setup instructions
- Update agent context for Copilot
