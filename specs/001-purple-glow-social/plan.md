# Implementation Plan: Purple Glow Social - AI Social Media Manager

**Branch**: `001-purple-glow-social` | **Date**: October 8, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-purple-glow-social/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Purple Glow Social is an AI-powered social media management platform designed specifically for South African service-based SMBs. The platform enables busy business owners to generate culturally relevant, multi-lingual social media content with minimal effort. Using Google Gemini AI for both text and image generation, the system learns from user edits through a confidence scoring mechanism, eventually transitioning from manual approval to autonomous posting. The platform integrates with major social media platforms via OAuth, implements tiered subscription billing through Paystack (ZAR), and provides analytics and lead insights capabilities. The entire stack leverages Next.js 15 with App Router, Supabase for backend services, and CopilotKit for natural language command interface.

## Technical Context

**Language/Version**: TypeScript (strict mode), Node.js 20+, React 18+

**Primary Dependencies**:

- Frontend: Next.js 15+ (App Router), React, Tailwind CSS, Shadcn UI, CopilotKit
- Backend: Supabase (PostgreSQL, Auth, Storage, Edge Functions), Zod for validation
- AI: Google Gemini 1.5 Pro (text), Gemini 2.5 Flash (gemini-2.5-flash-image-preview aka Nano Banana for images)
- Payments: Paystack SDK (ZAR billing)
- Testing: NEEDS CLARIFICATION (Jest/Vitest for unit, Playwright/Cypress for E2E)
- Social APIs: Facebook Graph API, Instagram Graph API, Twitter API v2, LinkedIn API

**Storage**:

- Database: Supabase PostgreSQL with Row Level Security (RLS) enabled
- File Storage: Supabase Storage for brand assets (logos, images)
- Session/Cache: NEEDS CLARIFICATION (Supabase session management, Redis for caching?)

**Testing**:

- Unit: NEEDS CLARIFICATION (Jest or Vitest)
- Integration: API route testing with NEEDS CLARIFICATION
- E2E: Chrome Dev Tools MCP for user flow testing and data scraping
- Contract: OpenAPI validation against contracts/openapi.yaml

**Target Platform**: Web application deployed on Vercel (Edge Functions + Serverless)

**Project Type**: Web application (frontend + backend API structure)

**Performance Goals**:

- Text generation: <3 seconds per post
- Image generation: <10 seconds per image
- Dashboard load: <2 seconds on standard broadband
- API response time: <200ms p95 for non-AI endpoints
- NEEDS CLARIFICATION: concurrent user targets, posts per second capacity

**Constraints**:

- Google Gemini API rate limits: NEEDS CLARIFICATION (requests/minute, tokens/day)
- Social media API rate limits: NEEDS CLARIFICATION (varies by platform)
- Security: Zero-trust architecture, RLS mandatory, POPIA compliance
- Multi-language: Support all 11 South African official languages
- Payment: ZAR currency only, Paystack gateway
- Real-time: NEEDS CLARIFICATION (WebSocket requirements for notifications, chat interface)

**Scale/Scope**:

- Target users: Small to medium service-based businesses in South Africa
- Initial capacity: NEEDS CLARIFICATION (concurrent users, DB sizing)
- Content volume: Starter 10/month, Growth 50/month, Enterprise unlimited
- Social platforms: 4 platforms (Facebook, Instagram, Twitter/X, LinkedIn)
- UI screens: NEEDS CLARIFICATION (~15-20 screens estimated: onboarding, dashboard, calendar, analytics, settings, admin)
- Database tables: ~10-15 tables (users, businesses, subscriptions, social_accounts, posts, brand_assets, analytics_data, confidence_scores, etc.)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Article I: Serve the User, Uncompromisingly

**Status**: ✅ PASS (Re-validated Post-Design)

- Target user clearly defined: busy, non-technical, service-based business owners in South Africa
- Features designed to save time (automated posting, AI generation)
- Complexity reduction via natural language interface (CopilotKit)
- Simple onboarding wizard (<10 minutes target)
- **Design validation**: Data model supports streamlined user workflows with minimal friction. Business profile captures essential context once. Confidence scoring system enables progressive automation (Phase 1 manual approval → Phase 2 autonomous posting).

### Article II: Authentically South African

**Status**: ✅ PASS (Re-validated Post-Design)

- All 11 official South African languages supported (FR-006)
- Cultural relevance and local context in AI generation
- ZAR currency via Paystack (FR-003)
- POPIA compliance mandatory (FR-021)
- **Design validation**: `preferred_languages` array in business_profiles table supports multi-language content. `subscriptions.amount_zar` explicitly stores ZAR pricing. Gemini multilingual prompts (research.md Section 9) ensure authentic SA content generation.

### Article III: Security and Privacy by Design

**Status**: ✅ PASS (Re-validated Post-Design)

- Zero-trust architecture specified in Technical Context
- Row Level Security (RLS) mandatory on all user data tables
- Secure token storage for OAuth (FR-008)
- POPIA compliance for all user data (FR-021)
- API keys and secrets as environment variables only
- **Design validation**: All 12 database tables in data-model.md include RLS policies. OAuth tokens encrypted in `social_accounts` table. API authentication enforced via Supabase Auth JWT (openapi.yaml security schemes). User data isolated per user_id/business_profile_id foreign keys.

### Article IV: API-First and Type-Safe

**Status**: ✅ PASS (Re-validated Post-Design)

- OpenAPI contract required (contracts/openapi.yaml)
- TypeScript strict mode
- Zod schemas for all data validation
- Backend API as first-class citizen
- **Design validation**: Complete OpenAPI 3.1 specification created (contracts/openapi.yaml) with 30+ endpoints. All request/response schemas defined. Data model provides foundation for Zod schema generation. TypeScript strict mode enforced in Technical Context.

### Article V: Comprehensive Testing & Automation

**Status**: ✅ PASS (Resolved Post-Research)

- ~~Testing framework not yet finalized (Jest vs Vitest)~~ **RESOLVED**: Vitest for unit/integration, Playwright for E2E (research.md Section 1)
- E2E testing approach defined (Chrome Dev Tools MCP for admin lead scraping + Playwright for user flows)
- Contract testing against OpenAPI spec (openapi.yaml)
- ~~CI/CD pipeline requirements need definition~~ **RESOLVED**: Vercel deployment with GitHub Actions for tests (research.md Section 10)
- Automated background jobs specified: pg_cron + Supabase Edge Functions (research.md Section 8) - post publishing every minute, OAuth token refresh hourly, analytics sync every 4 hours, confidence score calculation daily
- **Design validation**: Background job architecture uses pg_cron for scheduling + Edge Functions for execution. `api_rate_limits` table enables rate limit enforcement. State transitions in posts table (draft → pending_approval → approved → scheduled → published) support automated workflows.

### Technical Stack Compliance

**Status**: ✅ PASS (Re-validated Post-Design)

All specified technologies align with Article II of the Constitution:

- Frontend: Next.js 15+ (App Router) ✅
- Styling: Tailwind CSS with Shadcn UI ✅ (Purple Glow theme to be applied)
- Backend: Supabase ✅
- AI: Google Gemini APIs ✅ (Gemini 1.5 Pro for text, Gemini 2.5 Flash for images)
- In-App Agents: CopilotKit ✅ (Botpress for customer support - not yet in scope)
- Payment: Paystack ✅
- Deployment: Vercel ✅
- Testing: Vitest + Playwright ✅
- Caching: Supabase Edge cache + React Query ✅ (avoiding external Redis dependency per constitution's preference for simplicity)

### Overall Gate Status: ✅ FULL PASS (Post-Design)

The feature specification passes all constitutional gates. All "NEEDS CLARIFICATION" items from initial evaluation have been resolved through Phase 0 research (research.md) and validated through Phase 1 design (data-model.md, contracts/openapi.yaml). Design artifacts confirm:

1. **User-centric design**: Confidence scoring enables progressive automation based on user behavior
2. **SA authenticity**: Multi-language support built into data model and content generation
3. **Security**: RLS policies on all tables, encrypted OAuth tokens, JWT authentication
4. **API-first**: Complete OpenAPI contract with 30+ endpoints, type-safe schemas
5. **Testing/automation**: Vitest + Playwright testing strategy, pg_cron background jobs

No constitutional violations detected. Ready to proceed to Phase 2 (task breakdown).

## Project Structure

### Documentation (this feature)

```text
specs/001-purple-glow-social/
├── spec.md              # Feature specification (input)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── openapi.yaml    # API contract definitions
├── checklists/          # Existing
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/                     # Next.js 15 App Router
├── (auth)/              # Auth routes group
│   ├── login/
│   ├── signup/
│   └── oauth-callback/
├── (marketing)/         # Public marketing pages
│   ├── page.tsx         # Landing page
│   ├── pricing/
│   └── about/
├── (dashboard)/         # Authenticated app routes
│   ├── dashboard/       # Main dashboard
│   ├── calendar/        # Content calendar
│   ├── analytics/       # Analytics view
│   ├── settings/        # User settings
│   │   ├── profile/
│   │   ├── business/
│   │   ├── social/
│   │   └── billing/
│   └── onboarding/      # Onboarding wizard
├── (admin)/             # Admin panel routes
│   ├── dashboard/
│   └── insights/        # Lead insights tool
├── api/                 # API routes
│   ├── auth/
│   ├── content/
│   ├── social/
│   ├── webhooks/
│   └── admin/
├── layout.tsx           # Root layout
├── globals.css          # Global styles
└── error.tsx            # Error boundary

components/              # Shared React components
├── ui/                  # Shadcn UI components
├── auth/
├── dashboard/
├── calendar/
├── content/
├── analytics/
├── chat/                # CopilotKit integration
└── admin/

lib/                     # Shared utilities and services
├── supabase/            # Supabase client and helpers
│   ├── client.ts
│   ├── server.ts
│   └── middleware.ts
├── ai/                  # AI service integrations
│   ├── gemini-text.ts
│   ├── gemini-images.ts
│   └── confidence-scoring.ts
├── social/              # Social media API clients
│   ├── facebook.ts
│   ├── instagram.ts
│   ├── twitter.ts
│   └── linkedin.ts
├── payments/            # Paystack integration
│   └── paystack.ts
├── validations/         # Zod schemas
│   ├── user.ts
│   ├── business.ts
│   ├── content.ts
│   └── subscription.ts
├── utils/               # General utilities
└── constants/           # App constants

supabase/                # Supabase configuration
├── migrations/          # Database migrations
├── functions/           # Edge Functions
│   ├── schedule-posts/
│   ├── refresh-tokens/
│   └── generate-content/
└── config.toml          # Supabase config

tests/                   # Test suites
├── unit/                # Unit tests
├── integration/         # Integration tests
├── e2e/                 # E2E tests (Chrome Dev Tools MCP)
└── contract/            # API contract tests

public/                  # Static assets
├── images/
└── icons/

contracts/               # API contract definitions (symlink to specs/001-purple-glow-social/contracts/)
└── openapi.yaml
```

**Structure Decision**: Web application structure using Next.js 15 App Router. The application follows a monorepo-like structure with clear separation between frontend (app/), shared code (components/, lib/), backend logic (supabase/functions/), and API routes (app/api/). This aligns with the constitution's requirement for API-first development and enables both server-side and client-side rendering patterns. The route grouping strategy ((auth), (dashboard), (admin)) provides clean URL structures while organizing related functionality.

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
