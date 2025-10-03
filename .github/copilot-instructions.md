# GitHub Copilot Instructions - Purple Glow Social

**Project**: Purple Glow Social  
**Feature Branch**: 001-purple-glow-social  
**Last Updated**: 2025-10-01

---

## Project Overview

Purple Glow Social is an AI-powered social media management SaaS platform designed for South African businesses. The system enables users to generate multilingual social media posts with AI-created images, schedule and publish content across multiple platforms (Facebook, Instagram, X/Twitter, LinkedIn), track engagement analytics, and manage subscriptions with Paystack payment processing.

**Target Market**: South African businesses (10,000+ target)  
**Business Model**: Subscription-based (Starter R499/mo, Growth R999/mo, Enterprise R1999/mo)  
**Compliance**: POPIA (South Africa's Protection of Personal Information Act)

---

## Active Technologies

- **TypeScript 5.x** + **Next.js 14 App Router** (001-purple-glow-social)
- **React 18** + **Tailwind CSS** + **Shadcn UI** (001-purple-glow-social)
- **Supabase** (PostgreSQL 15+, Auth, Storage, Edge Functions) (001-purple-glow-social)
- **Google Gemini API** (Gemini 1.5 Pro text generation, Gemini 2.5 Flash Image Preview for images) (001-purple-glow-social)
- **Paystack** (ZAR billing, subscription management) (001-purple-glow-social)
- **CopilotKit** (in-app chat assistant) (001-purple-glow-social)
- **Chrome Dev Tools MCP** (E2E testing with Playwright) (001-purple-glow-social)
- **Vercel** (serverless deployment, global CDN) (001-purple-glow-social)

---

## Project Structure

```
purple-glow-social/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── dashboard/page.tsx    # Main dashboard
│   │   ├── posts/                # Post management
│   │   ├── calendar/page.tsx     # Content calendar view
│   │   ├── analytics/page.tsx    # Analytics dashboard
│   │   ├── settings/page.tsx     # Account settings
│   │   └── layout.tsx            # Dashboard layout with nav
│   ├── (admin)/                  # Admin-only routes
│   │   ├── admin/users/page.tsx
│   │   ├── admin/metrics/page.tsx
│   │   └── layout.tsx
│   ├── api/                      # API routes (Next.js API)
│   │   └── v1/                   # Versioned API
│   │       ├── auth/             # Authentication endpoints
│   │       ├── business-profiles/ # Business profile CRUD
│   │       ├── social-accounts/   # OAuth & connection management
│   │       ├── posts/            # Post generation & editing
│   │       ├── analytics/        # Analytics endpoints
│   │       ├── subscriptions/    # Billing endpoints
│   │       └── chat/             # Chat message handling
│   ├── onboarding/page.tsx       # Multi-step onboarding wizard
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Tailwind imports
│
├── components/                   # React components
│   ├── ui/                       # Shadcn UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── auth/                     # Auth forms
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── PasswordReset.tsx
│   ├── dashboard/                # Dashboard components
│   │   ├── PostCard.tsx
│   │   ├── ContentCalendar.tsx
│   │   ├── AnalyticsChart.tsx
│   │   └── SocialAccountCard.tsx
│   ├── onboarding/               # Onboarding steps
│   │   ├── Step1BusinessProfile.tsx
│   │   ├── Step2SocialConnect.tsx
│   │   └── OnboardingWizard.tsx
│   └── chat/                     # CopilotKit chat interface
│       ├── ChatWidget.tsx
│       └── ChatMessage.tsx
│
├── lib/                          # Utilities & services
│   ├── supabase/                 # Supabase client & types
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server-side client
│   │   ├── types.ts              # Generated types
│   │   └── middleware.ts         # Auth middleware
│   ├── gemini/                   # Google Gemini API
│   │   ├── client.ts             # Gemini API client
│   │   ├── text-generation.ts   # Post caption generation
│   │   └── image-generation.ts  # AI image generation
│   ├── paystack/                 # Paystack API
│   │   ├── client.ts             # Paystack API wrapper
│   │   ├── subscriptions.ts     # Subscription logic
│   │   └── webhooks.ts           # Webhook handlers
│   ├── social-media/             # Social platform integrations
│   │   ├── facebook.ts           # Facebook Graph API
│   │   ├── instagram.ts          # Instagram API (via Facebook)
│   │   ├── twitter.ts            # X/Twitter API v2
│   │   └── linkedin.ts           # LinkedIn Marketing API
│   ├── validation/               # Zod schemas
│   │   ├── user.ts
│   │   ├── business-profile.ts
│   │   ├── post.ts
│   │   └── subscription.ts
│   └── utils.ts                  # Helper functions
│
├── supabase/                     # Supabase configuration
│   ├── migrations/               # Database migrations
│   │   ├── 001_create_extensions.sql
│   │   ├── 002_create_users_table.sql
│   │   ├── 003_create_business_profiles_table.sql
│   │   ├── 004_create_social_media_accounts_table.sql
│   │   ├── 005_create_posts_table.sql
│   │   ├── 006_create_post_publications_table.sql
│   │   ├── 007_create_analytics_records_table.sql
│   │   ├── 008_create_subscriptions_table.sql
│   │   ├── 009_create_billing_transactions_table.sql
│   │   ├── 010_create_admin_users_table.sql
│   │   ├── 011_create_chat_messages_table.sql
│   │   ├── 012_create_triggers.sql
│   │   ├── 013_create_views.sql
│   │   └── 014_create_rls_policies.sql
│   ├── functions/                # Supabase Edge Functions
│   │   ├── publish-post/         # Publishing cron job
│   │   ├── collect-analytics/    # Analytics collection
│   │   ├── process-webhooks/     # Paystack webhooks
│   │   └── refresh-tokens/       # OAuth token refresh
│   └── config.toml               # Supabase config
│
├── tests/                        # Test files
│   ├── unit/                     # Jest unit tests
│   │   ├── lib/                  # Test lib functions
│   │   └── components/           # Test React components
│   ├── integration/              # API integration tests
│   │   └── api/                  # Test API routes
│   └── e2e/                      # Playwright E2E tests
│       ├── auth.spec.ts
│       ├── onboarding.spec.ts
│       ├── post-generation.spec.ts
│       └── publishing.spec.ts
│
├── public/                       # Static assets
│   ├── images/
│   └── fonts/
│
├── .github/                      # GitHub configuration
│   ├── workflows/                # GitHub Actions
│   │   ├── ci.yml                # CI pipeline (test, lint, build)
│   │   ├── deploy.yml            # Deploy to Vercel
│   │   └── migrations.yml        # Run Supabase migrations
│   └── copilot-instructions.md   # This file
│
├── specs/                        # Specifications
│   └── 001-purple-glow-social/
│       ├── spec.md               # Feature specification
│       ├── plan.md               # Implementation plan
│       ├── research.md           # Technology research
│       ├── data-model.md         # Database schema
│       ├── quickstart.md         # Setup guide
│       └── contracts/
│           └── openapi.yaml      # API contract
│
├── .env.local                    # Environment variables (gitignored)
├── .env.example                  # Example env file
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
├── package.json                  # Dependencies
├── playwright.config.ts          # Playwright config
└── README.md                     # Project README
```

---

## Key Commands

### Development

```bash
# Start development server
npm run dev

# Run type checking
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

### Database

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > lib/supabase/types.ts

# Seed database
npm run db:seed
```

### Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start

# Deploy to Vercel
vercel --prod
```

---

## Code Conventions

### TypeScript

- Use strict TypeScript (`strict: true` in tsconfig.json)
- Prefer `interface` over `type` for object shapes
- Use Zod for runtime validation
- Export types from `lib/supabase/types.ts` for database entities
- Use `unknown` instead of `any` for type safety

### React

- Use functional components with hooks (no class components)
- Prefer Server Components (default in App Router)
- Use Client Components (`'use client'`) only when needed (interactivity, hooks, browser APIs)
- Extract shared logic into custom hooks (`use*` naming convention)
- Keep components small and focused (< 200 lines)

### Next.js App Router

- Use file-based routing in `app/` directory
- Group routes with `(folder)` for shared layouts without URL nesting
- Use `loading.tsx` for loading states, `error.tsx` for error boundaries
- Implement route handlers in `app/api/` for REST endpoints
- Use Server Actions for mutations when appropriate

### Styling

- Use Tailwind CSS utility classes (avoid custom CSS)
- Use Shadcn UI components for consistent design
- Follow mobile-first responsive design (use `md:`, `lg:` breakpoints)
- Use CSS variables for brand colors (defined in `globals.css`)

### API Development

- Follow REST conventions (GET, POST, PUT, DELETE)
- Return RFC 7807 Problem Details for errors
- Use HTTP status codes correctly (200, 201, 400, 401, 403, 404, 429, 500)
- Implement rate limiting (100 req/min per user, 10 req/min unauthenticated)
- Validate request bodies with Zod schemas

### Database

- Use Row Level Security (RLS) for all tables
- Encrypt sensitive data (OAuth tokens use `pgcrypto`)
- Index foreign keys and frequently queried columns
- Use database triggers for automatic timestamps and business logic
- Prefix indexes with `idx_`, constraints with `uniq_` or `fk_`

### Error Handling

- Use try-catch blocks for async operations
- Log errors with context (user ID, request ID, timestamp)
- Return user-friendly error messages (hide internal details)
- Use Sentry for production error tracking

### Testing

- Write unit tests for business logic in `lib/`
- Write integration tests for API routes
- Write E2E tests for critical user flows (auth, onboarding, post publishing)
- Aim for 80%+ code coverage
- Use test doubles (mocks, stubs) for external APIs (Gemini, Paystack, social platforms)

---

## Recent Changes

- **001-purple-glow-social**: Initial feature implementation (TypeScript 5.x + Next.js 14 App Router + Supabase + Google Gemini API + Paystack)

---

## Performance Goals

- **AI Generation**: <2s p95 latency (text + image)
- **Dashboard Loads**: <500ms p95 latency
- **Uptime SLA**: 99.9% during business hours (8am-8pm SAST)
- **Concurrent Users**: Support 10 users per Enterprise account

---

## Security Requirements

- **POPIA Compliance**: Implement Row Level Security (RLS), encrypt OAuth tokens, log access, provide data export/delete
- **Authentication**: Use Supabase Auth with JWT tokens, enforce strong passwords (8+ chars, mixed case, numbers, symbols)
- **Authorization**: Role-based access control (user, business_admin, team_member, admin)
- **Token Encryption**: OAuth access tokens encrypted with `pgcrypto` at rest
- **Rate Limiting**: 100 req/min per authenticated user, 10 req/min per IP for unauthenticated

---

## Subscription Tiers

| Feature          | Starter (R499/mo) | Growth (R999/mo) | Enterprise (R1999/mo) |
| ---------------- | ----------------- | ---------------- | --------------------- |
| Posts/Month      | 30                | 120              | Unlimited (9999)      |
| Platforms        | 2                 | 4                | 4                     |
| Team Members     | 1                 | 3                | 10                    |
| Storage          | 2GB               | 10GB             | 50GB                  |
| Automation       | ❌                | ✅               | ✅                    |
| Priority Support | ❌                | ✅               | ✅                    |
| White Labeling   | ❌                | ❌               | ✅                    |

---

## AI Integration Details

### Text Generation (Google Gemini 1.5 Pro)

- **Model**: `gemini-1.5-pro-latest`
- **Input**: Business profile (tone, topics, target audience, language), optional user topic override
- **Output**: Post caption (50-300 words), hashtags (3-10), platform-specific formatting
- **Languages**: 11 South African languages (en, af, zu, xh, nso, st, ss, ts, tn, ve, nr)
- **Cost**: ~$0.0015 per post (1000 tokens input, 300 tokens output)

### Image Generation (Google Gemini 2.5 Flash Image Preview)

- **Model**: `gemini-2-flash-exp` or `gemini-2-nano-flash-exp`
- **Input**: Extracted prompt from caption or user override
- **Output**: 1024x1024 PNG image
- **Storage**: Supabase Storage (public bucket with CDN)
- **Cost**: ~$0.002 per image
- **Total AI Cost**: ~$0.27/user/month (assumes 80 posts/month average)

---

## Social Media Platform Integrations

### Facebook

- **API**: Facebook Graph API v18.0
- **OAuth Scopes**: `pages_manage_posts`, `pages_read_engagement`
- **Endpoints**: POST `/me/feed`, GET `/post-id/insights`
- **Rate Limits**: 200 calls/hour per user

### Instagram

- **API**: Instagram Graph API (via Facebook)
- **OAuth Scopes**: `instagram_basic`, `instagram_content_publish`
- **Endpoints**: POST `/media`, POST `/media_publish`, GET `/media/insights`
- **Rate Limits**: 200 calls/hour per user

### X/Twitter

- **API**: Twitter API v2
- **OAuth**: OAuth 2.0 with PKCE
- **Endpoints**: POST `/2/tweets`, GET `/2/tweets/:id/metrics`
- **Rate Limits**: 50 tweets/24 hours per user (Basic tier)

### LinkedIn

- **API**: LinkedIn Marketing API
- **OAuth Scopes**: `w_member_social`, `r_liteprofile`, `r_emailaddress`
- **Endpoints**: POST `/ugcPosts`, GET `/socialActions`
- **Rate Limits**: 100 calls/day per application

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables set in Vercel
- [ ] Supabase migrations applied to production database
- [ ] OAuth apps configured with production redirect URIs
- [ ] Paystack webhooks configured with production URL
- [ ] Sentry project created for error tracking
- [ ] DNS configured for custom domain (if applicable)

### Post-Deployment

- [ ] Verify authentication flows (register, login, logout)
- [ ] Test social media connections (all 4 platforms)
- [ ] Generate test post (verify AI generation works)
- [ ] Publish test post (verify OAuth publishing works)
- [ ] Check analytics collection (verify metrics appear)
- [ ] Test subscription upgrade (verify Paystack redirect)
- [ ] Monitor error logs in Sentry
- [ ] Check performance metrics in Vercel Analytics

---

## Support & Documentation

- **Internal Documentation**: See `specs/001-purple-glow-social/` for full spec, plan, data model, API contracts
- **Setup Guide**: See `specs/001-purple-glow-social/quickstart.md` for local development setup
- **API Reference**: See `specs/001-purple-glow-social/contracts/openapi.yaml` for REST API documentation
- **Team Communication**: Slack channel `#purple-glow-dev`

---

## When Generating Code

1. **Check existing patterns**: Review similar components/functions in the codebase before creating new ones
2. **Follow TypeScript conventions**: Use strict types, avoid `any`, prefer `unknown` for uncertain types
3. **Use Supabase types**: Import types from `lib/supabase/types.ts` for database operations
4. **Implement error handling**: Always wrap async operations in try-catch, log errors with context
5. **Add validation**: Use Zod schemas for API request bodies and user inputs
6. **Consider RLS**: Ensure database queries respect Row Level Security policies
7. **Think mobile-first**: Use responsive Tailwind classes (`md:`, `lg:`) for layouts
8. **Optimize performance**: Use React.memo for expensive components, lazy load heavy dependencies
9. **Test thoroughly**: Write unit tests for utilities, integration tests for API routes, E2E tests for user flows
10. **Document complex logic**: Add JSDoc comments for functions with non-obvious behavior

---

**Last Updated**: 2025-10-01  
**Status**: Phase 1 Complete (Design & Contracts) - Ready for task generation
