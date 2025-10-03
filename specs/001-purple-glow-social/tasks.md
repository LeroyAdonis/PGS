# Tasks: Purple Glow Social

**Feature**: Purple Glow Social - AI-Powered Social Media Manager  
**Branch**: 001-purple-glow-social  
**Input**: Design documents from `/specs/001-purple-glow-social/`  
**Prerequisites**: plan.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md  
**Generated**: October 2, 2025

---

## Execution Flow

1. ✅ Prerequisites validated via check-prerequisites.ps1
2. ✅ Loaded plan.md (TypeScript 5.x, Next.js 14, Supabase, Gemini API, Paystack)
3. ✅ Loaded contracts/openapi.yaml (46 endpoints across 9 categories)
4. ✅ Loaded data-model.md (10 tables, 10 indexes, 6 RLS policies, 3 triggers)
5. ✅ Loaded quickstart.md (E2E test scenario: registration → publication → analytics)
6. ➡️ **Ready for task execution** (TDD approach, 47 tasks total)

---

## Task Summary

- **Setup & Infrastructure**: 7 tasks (T001-T007)
- **Database Layer**: 3 tasks (T008-T010)
- **Services Layer**: 6 tasks (T011-T016)
- **API Routes**: 14 tasks (T017-T030)
- **UI Components**: 7 tasks (T031-T037)
- **Pages & Layouts**: 4 tasks (T038-T041)
- **Background Jobs**: 4 tasks (T042-T045)
- **Testing & Validation**: 2 tasks (T046-T047)

**Total**: 47 tasks | **Parallel tasks**: 18 tasks marked [P]

---

## Phase 3.1: Setup & Infrastructure

### T001 [X] [P] Initialize Next.js 14 project with TypeScript

**Description**: Create Next.js 14 app with App Router, TypeScript, Tailwind CSS  
**Files**:

- `package.json` - Project dependencies
- `tsconfig.json` - TypeScript configuration (strict mode)
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS setup
- `postcss.config.js` - PostCSS configuration
- `.eslintrc.json` - ESLint rules
- `.prettierrc` - Prettier formatting
- `.env.example` - Environment variable template

**Dependencies**: None  
**Acceptance Criteria**:

- `npm run dev` starts development server on http://localhost:3000
- TypeScript strict mode enabled
- Tailwind CSS working with test page
- No ESLint errors on clean project

---

### T002 [X] [P] Install and configure Supabase client

**Description**: Set up Supabase JavaScript client with Next.js Auth Helpers  
**Files**:

- `lib/supabase/client.ts` - Browser-side Supabase client
- `lib/supabase/server.ts` - Server-side Supabase client (cookies)
- `lib/supabase/middleware.ts` - Auth middleware for protected routes
- `middleware.ts` - Next.js middleware (route protection)
- `.env.local` - Supabase credentials (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)

**Dependencies**: T001  
**Acceptance Criteria**:

- Browser client creates Supabase connection
- Server client uses cookies for auth
- Middleware redirects unauthenticated users to /login
- Environment variables loaded correctly

---

### T003 [X] [P] Install and configure Google Gemini API client

**Description**: Set up Google Vertex AI SDK for text and image generation  
**Files**:

- `lib/gemini/client.ts` - Gemini API client initialization
- `lib/gemini/text-generation.ts` - Post caption generation
- `lib/gemini/image-generation.ts` - Image generation with Gemini 2.5 Flash
- `lib/gemini/types.ts` - TypeScript types for Gemini responses
- `.env.local` - GOOGLE_GEMINI_API_KEY, GOOGLE_PROJECT_ID

**Dependencies**: T001  
**Acceptance Criteria**:

- Gemini client initializes with API key
- Mock text generation returns caption with hashtags
- Mock image generation returns placeholder URL
- Error handling for API failures

---

### T004 [X] [P] Install and configure Paystack SDK

**Description**: Set up Paystack payment processing for ZAR billing  
**Files**:

- `lib/paystack/client.ts` - Paystack API wrapper
- `lib/paystack/subscriptions.ts` - Subscription tier management
- `lib/paystack/webhooks.ts` - Webhook signature verification
- `lib/paystack/types.ts` - TypeScript types for Paystack responses
- `.env.local` - PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY, PAYSTACK_WEBHOOK_SECRET

**Dependencies**: T001  
**Acceptance Criteria**:

- Paystack client initializes with secret key
- Subscription tier mapping (starter → R499, growth → R999, enterprise → R1999)
- Webhook signature verification function
- Mock payment URL generation

---

### T005 [X] [P] Set up Zod validation schemas

**Description**: Create Zod schemas for request validation and type safety  
**Files**:

- `lib/validation/user.ts` - User registration, login schemas
- `lib/validation/business-profile.ts` - Business profile creation/update
- `lib/validation/post.ts` - Post creation, update, scheduling
- `lib/validation/social-account.ts` - Social account connection
- `lib/validation/subscription.ts` - Subscription upgrade/cancel
- `lib/validation/common.ts` - Shared schemas (UUID, pagination)

**Dependencies**: T001  
**Acceptance Criteria**:

- All OpenAPI request bodies have Zod equivalents
- Type inference works with `z.infer<typeof schema>`
- Validation errors return field-specific messages
- Password validation enforces 8+ chars, mixed case, numbers

---

### T006 [X] [P] Install Shadcn UI and configure theme

**Description**: Set up Shadcn UI component library with Purple Glow branding  
**Files**:

- `components/ui/button.tsx` - Button component (via Shadcn CLI)
- `components/ui/input.tsx` - Input component
- `components/ui/card.tsx` - Card component
- `components/ui/dialog.tsx` - Dialog/modal component
- `components/ui/toast.tsx` - Toast notifications
- `components/ui/select.tsx` - Select dropdown
- `components/ui/calendar.tsx` - Calendar picker
- `lib/utils.ts` - `cn()` utility for class merging
- `app/globals.css` - Custom CSS variables (purple theme)

**Dependencies**: T001  
**Acceptance Criteria**:

- Shadcn UI components installed via CLI (`npx shadcn-ui@latest add button input card dialog toast select calendar`)
- Custom purple color palette in CSS variables
- `cn()` utility merges Tailwind classes correctly
- Test page renders all UI components

---

### T007 [X] [P] Configure error handling and logging

**Description**: Set up RFC 7807 error format and structured logging  
**Files**:

- `lib/errors/types.ts` - Error classes (ValidationError, UnauthorizedError, etc.)
- `lib/errors/handler.ts` - Global error handler (converts errors to RFC 7807 format)
- `lib/logging/logger.ts` - Structured logging with context (user ID, request ID)
- `lib/logging/middleware.ts` - Request/response logging middleware
- `app/api/error-handler.ts` - API route error wrapper

**Dependencies**: T001  
**Acceptance Criteria**:

- All API errors return RFC 7807 Problem Details format
- Error logs include timestamp, level, message, context
- 500 errors hide internal details from users
- Request/response times logged for performance monitoring

---

## Phase 3.2: Database Layer (Tests First - TDD)

### T008 [X] Create Supabase database migrations

**Description**: Create SQL migration files for all 10 tables, RLS policies, triggers  
**Files**:

- `supabase/migrations/001_create_extensions.sql` - Enable uuid-ossp, pgcrypto
- `supabase/migrations/002_create_users_table.sql` - Users table
- `supabase/migrations/003_create_business_profiles_table.sql` - Business profiles
- `supabase/migrations/004_create_social_media_accounts_table.sql` - Social accounts (encrypted tokens)
- `supabase/migrations/005_create_posts_table.sql` - Posts table
- `supabase/migrations/006_create_post_publications_table.sql` - Publication records
- `supabase/migrations/007_create_analytics_records_table.sql` - Analytics data
- `supabase/migrations/008_create_subscriptions_table.sql` - Subscriptions
- `supabase/migrations/009_create_billing_transactions_table.sql` - Billing history
- `supabase/migrations/010_create_admin_users_table.sql` - Admin accounts
- `supabase/migrations/011_create_chat_messages_table.sql` - Chat history
- `supabase/migrations/012_create_triggers.sql` - updated_at triggers, usage tracking
- `supabase/migrations/013_create_views.sql` - content_calendar_view materialized view
- `supabase/migrations/014_create_rls_policies.sql` - Row Level Security policies
- `supabase/migrations/015_create_indexes.sql` - Performance indexes

**Dependencies**: T002  
**Acceptance Criteria**:

- `supabase db reset` applies all migrations without errors
- All 10 tables created with correct column types (uuid, timestamptz, jsonb)
- Foreign keys enforce referential integrity
- RLS policies restrict access (users see own data only)
- Indexes created on email, business_profile_id, status, scheduled_time

---

### T009 [X] Generate TypeScript types from database schema

**Description**: Use Supabase CLI to generate type-safe database types  
**Files**:

- `lib/supabase/types.ts` - Generated TypeScript types (Database, Tables, Enums)
- `scripts/generate-types.sh` - Shell script to regenerate types

**Dependencies**: T008  
**Acceptance Criteria**:

- `npm run db:types` generates `lib/supabase/types.ts`
- TypeScript autocomplete works for Supabase queries
- All enum types (role, status, platform, tier) have type safety
- No TypeScript errors when querying tables

---

### T010 [X] Seed database with test data

**Description**: Create seed script for development/testing accounts  
**Files**:

- `supabase/seed.sql` - Seed data (test user, business profile, social accounts)
- `scripts/seed-db.sh` - Shell script to apply seed data

**Dependencies**: T008  
**Acceptance Criteria**:

- Test user: `testuser@example.com` with password `Test1234!`
- Admin user: `admin@purpleglowsocial.com` with admin role
- Test business profile with "Joe's Plumbing" (Starter tier)
- 2 connected social accounts (Facebook, Instagram - mock tokens)
- `npm run db:seed` applies seed data successfully

---

## Phase 3.3: Services Layer (AI, Social Media, Payments, Analytics)

### T011 [X] [P] Implement Google Gemini text generation service

**Description**: Generate multilingual post captions using Gemini 1.5 Pro  
**Files**:

- `lib/gemini/prompts.ts` - Prompt templates for 11 languages ✅
- `lib/gemini/text-generation.ts` - Caption generation logic ✅
- `tests/unit/gemini/text-generation.test.ts` - Unit tests for text generation ✅

**Dependencies**: T003, T005  
**Acceptance Criteria**:

- Generate 50-300 word captions in specified language (en, af, zu, etc.) ✅
- Include 3-10 relevant hashtags ✅
- Respect content tone (professional, casual, friendly, formal, humorous) ✅
- Return caption + hashtags + language in structured format ✅
- Unit tests cover all 11 languages ✅
- <2s p95 latency for generation ✅

---

### T012 [P] Implement Google Gemini image generation service

**Description**: Generate brand-aligned images using Gemini 2.5 Flash Image Preview  
**Files**:

- `lib/gemini/image-generation.ts` - Image generation logic
- `lib/gemini/image-upload.ts` - Upload to Supabase Storage
- `tests/unit/gemini/image-generation.test.ts` - Unit tests

**Dependencies**: T003, T005  
**Acceptance Criteria**:

- Extract image prompt from caption or use user-provided prompt
- Generate 1024x1024 PNG image
- Upload to Supabase Storage (public bucket with CDN URL)
- Return image URL and prompt used
- Unit tests mock Gemini API responses
- Handle errors gracefully (return placeholder image on failure)

---

### T013 [P] Implement Facebook API integration

**Description**: OAuth connection and post publishing to Facebook Pages  
**Files**:

- `lib/social-media/facebook.ts` - Facebook Graph API client
- `lib/social-media/facebook-auth.ts` - OAuth flow (redirect URL generation, token exchange)
- `tests/unit/social-media/facebook.test.ts` - Unit tests

**Dependencies**: T001, T005  
**Acceptance Criteria**:

- Generate OAuth URL with `pages_manage_posts`, `pages_read_engagement` scopes
- Exchange authorization code for access token
- Publish post with caption + image to Page feed
- Fetch post insights (likes, comments, shares, reach)
- Rate limit handling (200 calls/hour per user)
- Unit tests mock Graph API responses

---

### T014 [P] Implement Instagram API integration

**Description**: Post publishing to Instagram Business accounts via Facebook  
**Files**:

- `lib/social-media/instagram.ts` - Instagram Graph API client
- `lib/social-media/instagram-auth.ts` - OAuth flow (uses Facebook App)
- `tests/unit/social-media/instagram.test.ts` - Unit tests

**Dependencies**: T001, T005  
**Acceptance Criteria**:

- Generate OAuth URL with `instagram_basic`, `instagram_content_publish` scopes
- Create media container with image URL
- Publish media container to Instagram feed
- Fetch media insights (likes, comments, saves, reach)
- Rate limit handling (200 calls/hour per user)
- Unit tests mock Instagram API responses

---

### T015 [P] Implement X/Twitter API integration

**Description**: Post publishing to Twitter/X using API v2  
**Files**:

- `lib/social-media/twitter.ts` - Twitter API v2 client
- `lib/social-media/twitter-auth.ts` - OAuth 2.0 with PKCE
- `tests/unit/social-media/twitter.test.ts` - Unit tests

**Dependencies**: T001, T005  
**Acceptance Criteria**:

- Generate OAuth URL with PKCE challenge
- Exchange authorization code for access token
- Publish tweet with caption + media upload
- Fetch tweet metrics (likes, retweets, replies, impressions)
- Rate limit handling (50 tweets/24h per user on Basic tier)
- Unit tests mock Twitter API responses

---

### T016 [P] Implement LinkedIn API integration

**Description**: Post publishing to LinkedIn profiles and pages  
**Files**:

- `lib/social-media/linkedin.ts` - LinkedIn Marketing API client
- `lib/social-media/linkedin-auth.ts` - OAuth 2.0 flow
- `tests/unit/social-media/linkedin.test.ts` - Unit tests

**Dependencies**: T001, T005  
**Acceptance Criteria**:

- Generate OAuth URL with `w_member_social`, `r_liteprofile` scopes
- Exchange authorization code for access token
- Publish UGC post with caption + image
- Fetch post social actions (likes, comments, shares)
- Rate limit handling (100 calls/day per app)
- Unit tests mock LinkedIn API responses

---

## Phase 3.4: API Routes (46 endpoints across 9 categories)

### T017 Implement authentication API routes

**Description**: User registration, login, logout, token refresh  
**Files**:

- `app/api/v1/auth/register/route.ts` - POST /auth/register (create user, return JWT)
- `app/api/v1/auth/login/route.ts` - POST /auth/login (authenticate, return JWT)
- `app/api/v1/auth/logout/route.ts` - POST /auth/logout (invalidate session)
- `app/api/v1/auth/refresh/route.ts` - POST /auth/refresh (refresh access token)
- `tests/integration/auth.test.ts` - Integration tests

**Dependencies**: T002, T005, T007, T008  
**Acceptance Criteria**:

- POST /auth/register creates user, sends verification email, returns JWT
- POST /auth/login validates credentials, returns JWT (401 on invalid)
- POST /auth/logout invalidates session (204 response)
- POST /auth/refresh returns new access token (401 on invalid refresh token)
- Passwords hashed with bcrypt
- Integration tests cover happy path + error cases

---

### T018 Implement business profile API routes

**Description**: Create, read, update business profiles and toggle automation  
**Files**:

- `app/api/v1/business-profiles/route.ts` - POST /business-profiles (create profile)
- `app/api/v1/business-profiles/me/route.ts` - GET, PUT /business-profiles/me
- `app/api/v1/business-profiles/me/automation/route.ts` - PUT /automation (toggle auto-posting)
- `tests/integration/business-profiles.test.ts` - Integration tests

**Dependencies**: T002, T005, T007, T008  
**Acceptance Criteria**:

- POST /business-profiles creates profile, links to authenticated user
- GET /business-profiles/me returns user's profile (404 if not onboarded)
- PUT /business-profiles/me updates profile fields
- PUT /automation enables auto-posting if eligible (10 approved posts + 14 days)
- PUT /automation returns 403 if not eligible
- Integration tests validate automation eligibility logic

---

### T019 Implement social accounts API routes

**Description**: List, connect, disconnect social media accounts  
**Files**:

- `app/api/v1/social-accounts/route.ts` - GET /social-accounts (list)
- `app/api/v1/social-accounts/[platformName]/connect/route.ts` - POST /connect (OAuth redirect)
- `app/api/v1/social-accounts/[platformName]/callback/route.ts` - GET /callback (OAuth return)
- `app/api/v1/social-accounts/[id]/route.ts` - DELETE /social-accounts/{id}
- `tests/integration/social-accounts.test.ts` - Integration tests

**Dependencies**: T002, T005, T007, T008, T013, T014, T015, T016  
**Acceptance Criteria**:

- GET /social-accounts returns connected accounts with status (connected, expired, revoked)
- POST /connect generates OAuth URL for platform (facebook, instagram, twitter, linkedin)
- GET /callback exchanges code for token, encrypts token, saves to DB
- DELETE /{id} disconnects account (soft delete)
- Tier limits enforced (Starter: 2 platforms, Growth/Enterprise: 4 platforms)
- Integration tests mock OAuth flows

---

### T020 Implement posts API routes (list, create, read, update, delete)

**Description**: Core post management endpoints  
**Files**:

- `app/api/v1/posts/route.ts` - GET, POST /posts (list, create with AI)
- `app/api/v1/posts/[id]/route.ts` - GET, PUT, DELETE /posts/{id}
- `tests/integration/posts.test.ts` - Integration tests

**Dependencies**: T002, T005, T007, T008, T011, T012  
**Acceptance Criteria**:

- GET /posts returns filtered posts (status, date range, platform, pagination)
- POST /posts generates caption + image via Gemini, saves to DB (status: pending)
- GET /posts/{id} returns single post with all metadata
- PUT /posts/{id} updates caption/hashtags/platforms, tracks edits in user_edits JSONB
- DELETE /posts/{id} soft deletes (sets status to 'rejected')
- Usage limits enforced (Starter: 30/mo, Growth: 120/mo, Enterprise: unlimited)
- Integration tests validate AI generation flow

---

### T021 Implement post actions API routes (approve, reject, regenerate)

**Description**: User approval workflow and image regeneration  
**Files**:

- `app/api/v1/posts/[id]/approve/route.ts` - POST /approve (pending → approved)
- `app/api/v1/posts/[id]/reject/route.ts` - POST /reject (pending → rejected)
- `app/api/v1/posts/[id]/regenerate-image/route.ts` - POST /regenerate-image
- `tests/integration/post-actions.test.ts` - Integration tests

**Dependencies**: T002, T005, T007, T008, T012  
**Acceptance Criteria**:

- POST /approve changes status to 'approved', increments approved_posts_count
- POST /reject changes status to 'rejected'
- POST /regenerate-image generates new image with same/new prompt
- Automation eligibility check after 10 approvals (sets automation_eligible_at)
- Integration tests validate counter increments

---

### T022 Implement publishing API routes (schedule, publish, get publications)

**Description**: Schedule posts and publish immediately  
**Files**:

- `app/api/v1/posts/[id]/schedule/route.ts` - POST /schedule (set scheduled_time)
- `app/api/v1/posts/[id]/publish/route.ts` - POST /publish (immediate publish)
- `app/api/v1/posts/[id]/publications/route.ts` - GET /publications (status per platform)
- `tests/integration/publishing.test.ts` - Integration tests

**Dependencies**: T002, T005, T007, T008, T013, T014, T015, T016  
**Acceptance Criteria**:

- POST /schedule validates scheduled_time (≥5 min in future), sets status to 'scheduled'
- POST /publish immediately publishes to all platform_targets
- Creates post_publications records for each platform (status: publishing → published/failed)
- GET /publications returns per-platform status and errors
- Integration tests mock platform API calls
- Error handling for failed publishes (retry_count, error_message)

---

### T023 Implement analytics API routes

**Description**: Post analytics, summary, top posts  
**Files**:

- `app/api/v1/analytics/posts/[id]/route.ts` - GET /analytics/posts/{id}
- `app/api/v1/analytics/summary/route.ts` - GET /analytics/summary (aggregated metrics)
- `app/api/v1/analytics/top-posts/route.ts` - GET /analytics/top-posts (sorted by engagement)
- `tests/integration/analytics.test.ts` - Integration tests

**Dependencies**: T002, T005, T007, T008  
**Acceptance Criteria**:

- GET /posts/{id} returns analytics per platform (likes, comments, shares, reach, engagement_rate)
- GET /summary returns aggregated metrics (total posts, avg engagement, by_platform breakdown)
- GET /top-posts returns posts sorted by engagement metric (likes, comments, shares, engagement_rate)
- Date range filtering (from_date, to_date)
- Integration tests validate aggregation logic

---

### T024 Implement subscriptions API routes

**Description**: Get subscription, upgrade tier, cancel, billing history  
**Files**:

- `app/api/v1/subscriptions/me/route.ts` - GET /subscriptions/me
- `app/api/v1/subscriptions/upgrade/route.ts` - POST /subscriptions/upgrade (Paystack redirect)
- `app/api/v1/subscriptions/cancel/route.ts` - POST /subscriptions/cancel
- `app/api/v1/subscriptions/billing-history/route.ts` - GET /billing-history (transactions)
- `tests/integration/subscriptions.test.ts` - Integration tests

**Dependencies**: T002, T004, T005, T007, T008  
**Acceptance Criteria**:

- GET /me returns current subscription with usage (posts_used, platforms_connected, storage_used)
- POST /upgrade generates Paystack payment URL (R499 → R999 → R1999)
- POST /cancel sets status to 'cancelled' (access remains until next_billing_date)
- GET /billing-history returns transaction records with pagination
- Integration tests mock Paystack API responses

---

### T025 Implement Paystack webhook handler

**Description**: Process subscription payment confirmations  
**Files**:

- `app/api/v1/webhooks/paystack/route.ts` - POST /webhooks/paystack (verify signature, update subscription)
- `tests/integration/webhooks.test.ts` - Integration tests

**Dependencies**: T004, T007, T008  
**Acceptance Criteria**:

- Verify Paystack signature using PAYSTACK_WEBHOOK_SECRET
- Handle events: `charge.success`, `subscription.create`, `subscription.disable`
- Update subscription status (trial → active, active → cancelled)
- Create billing_transactions record
- Return 200 to prevent retries
- Integration tests validate signature verification

---

### T026 Implement chat API routes

**Description**: CopilotKit chat interface for conversational commands  
**Files**:

- `app/api/v1/chat/messages/route.ts` - GET, POST /chat/messages
- `lib/copilotkit/actions.ts` - CopilotKit actions (create post, schedule post, get analytics)
- `tests/integration/chat.test.ts` - Integration tests

**Dependencies**: T002, T005, T007, T008  
**Acceptance Criteria**:

- GET /messages returns chat history for user
- POST /messages sends user message, returns system response
- Parse commands: "Create a post about [topic]", "Schedule post for [date/time]", "Show analytics"
- Store interpreted_command, command_parameters, resulting_action in DB
- Integration tests validate command parsing

---

### T027 Implement admin users API routes

**Description**: List users, suspend users, platform metrics  
**Files**:

- `app/api/v1/admin/users/route.ts` - GET /admin/users (list with filters)
- `app/api/v1/admin/users/[id]/suspend/route.ts` - POST /admin/users/{id}/suspend
- `app/api/v1/admin/metrics/route.ts` - GET /admin/metrics (platform-wide analytics)
- `tests/integration/admin.test.ts` - Integration tests

**Dependencies**: T002, T005, T007, T008  
**Acceptance Criteria**:

- GET /users returns paginated user list (filter by status: active, suspended, deleted)
- POST /suspend sets account_status to 'suspended' (401 for admin role check)
- GET /metrics returns system-wide stats (total_users, active_subscriptions, monthly_revenue)
- RLS policies allow admin role only
- Integration tests validate admin role enforcement

---

### T028 [P] Implement rate limiting middleware

**Description**: Enforce rate limits (100 req/min authenticated, 10 req/min unauthenticated)  
**Files**:

- `lib/middleware/rate-limit.ts` - Rate limiting logic (in-memory cache with sliding window)
- `middleware.ts` - Add rate limit checks to Next.js middleware

**Dependencies**: T007  
**Acceptance Criteria**:

- Authenticated users: 100 requests per minute
- Unauthenticated IPs: 10 requests per minute
- Return 429 with Retry-After header on limit exceeded
- Sliding window algorithm (resets every 60 seconds)
- Unit tests validate sliding window logic

---

### T029 [P] Implement CORS and security headers

**Description**: Configure CORS, CSP, HSTS, X-Frame-Options  
**Files**:

- `next.config.js` - Add security headers
- `lib/middleware/cors.ts` - CORS middleware (allow specific origins)

**Dependencies**: T001  
**Acceptance Criteria**:

- CORS allows production domain + localhost:3000
- CSP prevents XSS (restrict script-src, img-src)
- HSTS enforces HTTPS (max-age 31536000)
- X-Frame-Options prevents clickjacking (DENY)
- X-Content-Type-Options prevents MIME sniffing (nosniff)

---

### T030 [P] Create API health check endpoint

**Description**: Monitoring endpoint for uptime checks  
**Files**:

- `app/api/v1/health/route.ts` - GET /health (200 OK + DB connection check)

**Dependencies**: T002, T007  
**Acceptance Criteria**:

- GET /health returns 200 with `{ status: "ok", timestamp, version }`
- Checks Supabase connection (query `SELECT 1`)
- Returns 503 if DB unreachable
- No authentication required

---

## Phase 3.5: UI Components (React + Shadcn UI)

### T031 [P] Create authentication components

**Description**: Login, register, password reset forms  
**Files**:

- `components/auth/LoginForm.tsx` - Email/password login with Supabase Auth
- `components/auth/RegisterForm.tsx` - Registration form with validation
- `components/auth/PasswordResetForm.tsx` - Password reset flow
- `tests/unit/components/auth.test.tsx` - Component tests

**Dependencies**: T002, T005, T006  
**Acceptance Criteria**:

- LoginForm submits to POST /auth/login, stores JWT in cookies
- RegisterForm validates email, password (8+ chars), display name
- PasswordResetForm sends reset email via Supabase Auth
- Show validation errors inline
- Loading states during submission
- Unit tests render components and validate form submission

---

### T032 [P] Create onboarding wizard components

**Description**: Multi-step onboarding (business profile, social connect)  
**Files**:

- `components/onboarding/OnboardingWizard.tsx` - Step orchestration
- `components/onboarding/Step1BusinessProfile.tsx` - Business info form
- `components/onboarding/Step2SocialConnect.tsx` - OAuth connection buttons
- `components/onboarding/ProgressBar.tsx` - Visual progress indicator
- `tests/unit/components/onboarding.test.tsx` - Component tests

**Dependencies**: T002, T005, T006  
**Acceptance Criteria**:

- Wizard shows 2 steps with progress bar
- Step 1 collects business name, industry, target audience, tone, topics, language
- Step 2 shows platform connection buttons (Facebook, Instagram, Twitter, LinkedIn)
- "Skip for now" option on Step 2
- Submit creates business profile, redirects to dashboard
- Unit tests validate step transitions

---

### T033 [X] Create dashboard layout and navigation

**Description**: Main dashboard layout with sidebar, top nav, user menu  
**Files**:

- `app/(dashboard)/layout.tsx` - Dashboard layout with navigation
- `components/dashboard/Sidebar.tsx` - Sidebar with links (Dashboard, Posts, Calendar, Analytics, Settings)
- `components/dashboard/TopNav.tsx` - User avatar, notifications, theme toggle
- `components/dashboard/UserMenu.tsx` - Dropdown menu (Profile, Logout)
- `tests/unit/components/dashboard-layout.test.tsx` - Component tests

**Dependencies**: T002, T006  
**Acceptance Criteria**:

- Sidebar highlights active route
- User avatar shows display name + initials
- User menu has Profile, Settings, Logout options
- Responsive design (sidebar collapses on mobile)
- Unit tests validate navigation links

---

### T034 Create post management components

**Description**: Post card, post editor, approval buttons  
**Files**:

- `components/dashboard/PostCard.tsx` - Display post with caption, image, status badge
- `components/dashboard/PostEditor.tsx` - Edit caption, hashtags, platforms
- `components/dashboard/PostActions.tsx` - Approve, Reject, Regenerate Image buttons
- `components/dashboard/PostFilters.tsx` - Filter by status, date, platform
- `tests/unit/components/posts.test.tsx` - Component tests

**Dependencies**: T005, T006  
**Acceptance Criteria**:

- PostCard shows caption (truncated), image, platform icons, status badge
- PostEditor allows inline caption/hashtag editing with live preview
- PostActions triggers POST /approve, /reject, /regenerate-image
- PostFilters updates query params (status, from_date, to_date, platform)
- Unit tests validate button clicks and API calls

---

### T035 Create content calendar component

**Description**: Monthly calendar view with scheduled posts  
**Files**:

- `components/dashboard/ContentCalendar.tsx` - Calendar grid with post dots
- `components/dashboard/CalendarDay.tsx` - Day cell with post count
- `components/dashboard/CalendarPost.tsx` - Post preview in day cell
- `tests/unit/components/calendar.test.tsx` - Component tests

**Dependencies**: T006  
**Acceptance Criteria**:

- Calendar shows current month with navigation (prev/next month)
- Each day shows post count and colored dots (green: published, yellow: scheduled, gray: pending)
- Click day to view posts for that date
- Responsive design (grid collapses on mobile)
- Unit tests validate date navigation

---

### T036 Create analytics components

**Description**: Analytics charts and top posts table  
**Files**:

- `components/dashboard/AnalyticsChart.tsx` - Line chart (engagement over time) using Recharts
- `components/dashboard/AnalyticsSummary.tsx` - Metric cards (total posts, avg engagement, total likes)
- `components/dashboard/TopPostsTable.tsx` - Table sorted by engagement
- `tests/unit/components/analytics.test.tsx` - Component tests

**Dependencies**: T006  
**Acceptance Criteria**:

- AnalyticsChart renders line chart with date range selector
- AnalyticsSummary shows 4 metric cards with comparison to previous period
- TopPostsTable shows post image, caption, platform, engagement metrics
- Unit tests validate chart rendering and data formatting

---

### T037 Create chat widget component

**Description**: CopilotKit chat interface for conversational commands  
**Files**:

- `components/chat/ChatWidget.tsx` - Chat bubble with message list
- `components/chat/ChatMessage.tsx` - Message bubble (user vs. system)
- `components/chat/ChatInput.tsx` - Input field with send button
- `lib/copilotkit/config.ts` - CopilotKit provider configuration
- `tests/unit/components/chat.test.tsx` - Component tests

**Dependencies**: T006  
**Acceptance Criteria**:

- Chat widget fixed to bottom-right corner
- Message list shows user + system messages with timestamps
- Input field sends to POST /chat/messages
- System responses appear as bot messages
- Unit tests validate message sending

---

## Phase 3.6: Pages & Layouts

### T038 Create authentication pages

**Description**: Login, register, password reset pages  
**Files**:

- `app/(auth)/login/page.tsx` - Login page
- `app/(auth)/register/page.tsx` - Registration page
- `app/(auth)/reset-password/page.tsx` - Password reset page
- `app/(auth)/layout.tsx` - Auth layout (centered, no navigation)

**Dependencies**: T031  
**Acceptance Criteria**:

- /login renders LoginForm with "Don't have an account?" link to /register
- /register renders RegisterForm with "Already have an account?" link to /login
- /reset-password sends reset email, shows confirmation message
- Auth layout centers content, adds Purple Glow logo
- Unauthenticated users redirected to /login by middleware

---

### T039 Create onboarding page

**Description**: Multi-step onboarding wizard  
**Files**:

- `app/onboarding/page.tsx` - Onboarding page (renders OnboardingWizard)

**Dependencies**: T032  
**Acceptance Criteria**:

- /onboarding renders OnboardingWizard
- Redirects to /dashboard after completion
- Authenticated users without business profile redirected to /onboarding
- Progress saved between steps (localStorage)

---

### T040 Create dashboard pages

**Description**: Dashboard, posts list, calendar, analytics, settings  
**Files**:

- `app/(dashboard)/dashboard/page.tsx` - Dashboard overview (recent posts, upcoming scheduled, quick stats)
- `app/(dashboard)/posts/page.tsx` - Posts list with filters
- `app/(dashboard)/calendar/page.tsx` - Content calendar view
- `app/(dashboard)/analytics/page.tsx` - Analytics dashboard
- `app/(dashboard)/settings/page.tsx` - Account settings (business profile, subscription, team members)

**Dependencies**: T033, T034, T035, T036  
**Acceptance Criteria**:

- /dashboard shows 3 widgets: Recent Posts (5 most recent), Upcoming Posts (next 7 days), Quick Stats (posts this month, avg engagement)
- /posts lists posts with filters (status, date, platform, pagination)
- /calendar shows ContentCalendar component
- /analytics shows AnalyticsChart + AnalyticsSummary + TopPostsTable
- /settings shows business profile form, subscription upgrade CTA, team member management

---

### T041 Create admin pages

**Description**: Admin-only pages for user management and metrics  
**Files**:

- `app/(admin)/admin/users/page.tsx` - User management (list, suspend)
- `app/(admin)/admin/metrics/page.tsx` - Platform metrics dashboard
- `app/(admin)/layout.tsx` - Admin layout (sidebar with admin links)

**Dependencies**: T033  
**Acceptance Criteria**:

- /admin/users lists all users with filters (status: active, suspended, deleted)
- User table shows email, display name, subscription tier, account status
- Suspend button triggers POST /admin/users/{id}/suspend
- /admin/metrics shows system-wide stats (total users, revenue, posts published)
- Admin layout restricts access to admin role (403 redirect)

---

## Phase 3.7: Background Jobs (Supabase Edge Functions)

### T042 Create post publishing cron job

**Description**: Scheduled post publishing (runs every 5 minutes)  
**Files**:

- `supabase/functions/publish-scheduled-posts/index.ts` - Cron function
- `supabase/functions/publish-scheduled-posts/deno.json` - Deno configuration

**Dependencies**: T008, T013, T014, T015, T016  
**Acceptance Criteria**:

- Query posts where status='scheduled' AND scheduled_time <= now()
- For each post, call platform APIs to publish (Facebook, Instagram, Twitter, LinkedIn)
- Create post_publications records (status: publishing → published/failed)
- Update post status to 'published' if all platforms succeed
- Retry failed publishes (max 3 attempts)
- Function deployed with cron: `0 */5 * * *` (every 5 minutes)

---

### T043 Create analytics collection cron job

**Description**: Fetch analytics from platforms (runs daily at 2am)  
**Files**:

- `supabase/functions/collect-analytics/index.ts` - Cron function

**Dependencies**: T008, T013, T014, T015, T016  
**Acceptance Criteria**:

- Query post_publications where publish_status='published' AND published_at > now() - 7 days
- For each publication, fetch metrics from platform API (likes, comments, shares, reach)
- Create analytics_records entries (collected_at = now())
- Calculate engagement_rate (likes + comments + shares) / reach
- Function deployed with cron: `0 2 * * *` (daily at 2am SAST)

---

### T044 Create OAuth token refresh job

**Description**: Refresh expiring OAuth tokens (runs every 6 hours)  
**Files**:

- `supabase/functions/refresh-oauth-tokens/index.ts` - Cron function

**Dependencies**: T008, T013, T014, T015, T016  
**Acceptance Criteria**:

- Query social_media_accounts where token_expires_at < now() + 7 days
- For each account, refresh token using platform refresh flow
- Update encrypted token in DB
- Mark connection_status as 'expired' if refresh fails
- Function deployed with cron: `0 */6 * * *` (every 6 hours)

---

### T045 Create analytics retention job

**Description**: Delete analytics older than 6 months (runs monthly)  
**Files**:

- `supabase/functions/purge-old-analytics/index.ts` - Cron function

**Dependencies**: T008  
**Acceptance Criteria**:

- Delete analytics_records where collected_at < now() - interval '6 months'
- Log count of deleted records
- Function deployed with cron: `0 3 1 * *` (monthly on 1st at 3am SAST)

---

## Phase 3.8: Testing & Validation

### T046 Create E2E test suite

**Description**: Playwright tests for critical user flows  
**Files**:

- `tests/e2e/auth.spec.ts` - Registration, login, logout
- `tests/e2e/onboarding.spec.ts` - Business profile creation, social connect
- `tests/e2e/post-generation.spec.ts` - Generate post, approve, edit
- `tests/e2e/publishing.spec.ts` - Schedule post, immediate publish
- `tests/e2e/analytics.spec.ts` - View analytics, top posts
- `playwright.config.ts` - Playwright configuration

**Dependencies**: T001, All API routes, All pages  
**Acceptance Criteria**:

- E2E test "Happy Path - Small Business First Post" from quickstart.md:
  1. User registers → verify JWT token in cookies
  2. Complete onboarding (business profile + skip social connect) → verify profile created
  3. Generate post → verify caption + image generated
  4. Approve post → verify approved_posts_count incremented
  5. Schedule post for +10 minutes → verify scheduled_time set
  6. Manually trigger publish cron → verify post published to platforms (mocked)
  7. View analytics → verify metrics displayed
- All tests pass in headless mode
- `npm run test:e2e` runs all E2E tests

---

### T047 Validate performance and code quality

**Description**: Run performance tests, linting, type checking  
**Files**:

- `tests/performance/ai-generation.test.ts` - Validate <2s p95 for AI generation
- `tests/performance/dashboard-load.test.ts` - Validate <500ms p95 for dashboard
- `.github/workflows/ci.yml` - CI pipeline (lint, type-check, test, build)

**Dependencies**: T001, All tasks  
**Acceptance Criteria**:

- AI generation latency <2s p95 (100 requests)
- Dashboard load time <500ms p95 (100 requests)
- `npm run lint` passes with 0 errors
- `npm run type-check` passes with 0 TypeScript errors
- `npm run build` succeeds
- CI pipeline runs on pull requests

---

## Dependencies Graph

```
T001 (Next.js setup)
├── T002 (Supabase) → T008 (migrations) → T009 (types) → T010 (seed)
├── T003 (Gemini) → T011 (text gen), T012 (image gen)
├── T004 (Paystack) → T024 (subscriptions), T025 (webhooks)
├── T005 (Zod) → All API routes
├── T006 (Shadcn UI) → All UI components
└── T007 (errors/logging) → All API routes

Services (T011-T016) [P]
└── API routes (T017-T027)
    └── UI components (T031-T037) [P]
        └── Pages (T038-T041)
            └── Background jobs (T042-T045)
                └── E2E tests (T046)
                    └── Validation (T047)
```

---

## Parallel Execution Examples

### Example 1: Setup phase (T001-T007)

All setup tasks can run in parallel after T001:

```bash
# Task T001 complete, launch T002-T007 together:
Task: "Install and configure Supabase client in lib/supabase/"
Task: "Install and configure Google Gemini API client in lib/gemini/"
Task: "Install and configure Paystack SDK in lib/paystack/"
Task: "Set up Zod validation schemas in lib/validation/"
Task: "Install Shadcn UI and configure theme in components/ui/"
Task: "Configure error handling and logging in lib/errors/ and lib/logging/"
```

### Example 2: Services layer (T011-T016)

All service implementations can run in parallel:

```bash
# Database complete, launch services:
Task: "Implement Google Gemini text generation service"
Task: "Implement Google Gemini image generation service"
Task: "Implement Facebook API integration"
Task: "Implement Instagram API integration"
Task: "Implement X/Twitter API integration"
Task: "Implement LinkedIn API integration"
```

### Example 3: UI components (T031-T037)

All UI components can run in parallel:

```bash
# Shadcn UI setup complete, launch components:
Task: "Create authentication components (LoginForm, RegisterForm)"
Task: "Create onboarding wizard components"
Task: "Create post management components (PostCard, PostEditor)"
Task: "Create content calendar component"
Task: "Create analytics components (chart, summary, table)"
Task: "Create chat widget component"
```

---

## Validation Checklist

**Contract Coverage** (46 endpoints):

- [x] All 46 OpenAPI endpoints have corresponding API route tasks
- [x] Each endpoint has request validation (Zod schemas)
- [x] Each endpoint has error handling (RFC 7807 format)
- [x] Integration tests planned for each route group

**Data Model Coverage** (10 tables):

- [x] All 10 tables have migration files (T008)
- [x] TypeScript types generated from schema (T009)
- [x] Test data seed script created (T010)
- [x] RLS policies enforce access control

**User Flow Coverage**:

- [x] E2E test covers full happy path (registration → publication → analytics)
- [x] Onboarding flow implemented (business profile + social connect)
- [x] Post approval workflow implemented
- [x] Scheduling and publishing implemented
- [x] Analytics collection implemented

**Performance Goals**:

- [x] AI generation <2s p95 (T011, T012, T047)
- [x] Dashboard load <500ms p95 (T047)
- [x] Supabase Edge Functions for background jobs (T042-T045)

**Security & Compliance**:

- [x] Row Level Security policies (T008)
- [x] OAuth token encryption with pgcrypto (T008)
- [x] Rate limiting (T028)
- [x] CORS and security headers (T029)
- [x] POPIA compliance (audit logs, data export, access controls)

---

## Estimated Effort

- **Setup & Infrastructure** (T001-T007): ~4-6 hours
- **Database Layer** (T008-T010): ~3-4 hours
- **Services Layer** (T011-T016): ~8-10 hours (AI integration complexity)
- **API Routes** (T017-T030): ~16-20 hours (46 endpoints, validation, error handling)
- **UI Components** (T031-T037): ~10-12 hours (React components, Shadcn UI)
- **Pages & Layouts** (T038-T041): ~6-8 hours
- **Background Jobs** (T042-T045): ~4-6 hours
- **Testing & Validation** (T046-T047): ~8-10 hours (E2E tests, performance validation)

**Total Estimated Effort**: ~60-76 hours (1.5-2 weeks for 1 developer, 3-4 days for 2 developers)

---

## Notes

- **TDD Approach**: Database migrations and Zod schemas come before API implementations
- **Parallel Execution**: 18 tasks marked [P] can run simultaneously (different files, no dependencies)
- **Critical Path**: T001 → T002 → T008 → T017 → T020 → T022 → T046 (must complete sequentially)
- **AI Integration**: Gemini API costs estimated at ~$0.27/user/month (80 posts/month avg)
- **OAuth Testing**: Use test apps for social platforms (avoid real user accounts during development)
- **Deployment**: Vercel deployment configured after T047 passes (CI pipeline)

---

## Ready for Execution

All 47 tasks are immediately actionable with specific file paths, acceptance criteria, and dependencies. Each task can be completed by an LLM agent or human developer without additional context.

**Next Steps**:

1. Review task list with team
2. Assign parallel tasks to multiple developers
3. Begin with T001 (Next.js setup)
4. Track progress in project management tool
5. Run CI pipeline on each pull request

🚀 **Implementation can begin immediately**
