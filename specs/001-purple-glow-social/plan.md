# Implementation Plan: Purple Glow Social

**Branch**: `001-purple-glow-social` | **Date**: 2025-10-03 | **Spec**: `specs/001-purple-glow-social/spec.md`
**Input**: Feature specification and clarifications located at `C:\scratchpad\PGS\specs\001-purple-glow-social\spec.md`

## Execution Flow (/plan command scope)

```text
1. Load feature spec from Input path ✅
2. Fill Technical Context (scan for NEEDS CLARIFICATION) ✅
3. Fill the Constitution Check section based on the constitution document ✅
4. Evaluate Constitution Check section (Initial gate) ✅
5. Execute Phase 0 → research.md (complete, see Phase 0 summary) ✅
6. Execute Phase 1 → data-model.md, contracts/, quickstart.md, copilot instructions ✅
7. Re-evaluate Constitution Check section (Post-design gate) ✅
8. Plan Phase 2 → Describe task generation approach ✅
9. STOP - Ready for /tasks command
```

## Summary

Purple Glow Social delivers an AI-powered social media management SaaS focused on South African SMBs. The solution combines a Next.js 14 App Router front-end, Supabase (PostgreSQL, Auth, Storage, Edge Functions) backend, Google Gemini for multilingual caption and image generation, and Paystack for local subscription billing. Clarifications completed on 2025-10-01 locked pricing tiers, usage limits, automation rules, and retention policies. Phase 0 research confirms technology selections and risk mitigations; Phase 1 design artifacts (data model, OpenAPI contracts, quickstart) define the system boundaries, compliance posture (POPIA), and developer workflow. This plan governs execution on branch `001-purple-glow-social` with TDD-first task sequencing and strict rate-limiting, logging, and security requirements.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 14 App Router (Edge runtime), Supabase Edge Functions (Deno), SQL (PostgreSQL 15)  
**Primary Dependencies**: Next.js, React 18, Tailwind CSS + Shadcn UI, Supabase JS client, Google Gemini SDK, CopilotKit, Paystack Node SDK, Zod, date-fns, Playwright, Jest  
**Storage**: Supabase PostgreSQL (row-level security enforced) and Supabase Storage (S3-compatible buckets for brand assets & generated media)  
**Testing**: Jest + Testing Library (unit/integration), Playwright via Chrome Dev Tools MCP (E2E), Supabase CLI migrations/type generation, ESLint + TypeScript strict checking  
**Target Platform**: Vercel deployment (Edge functions + serverless routes) with Supabase managed services; local development via `npm run dev` + `supabase start`  
**Project Type**: Web application (full-stack Next.js monorepo)  
**Performance Goals**: AI generation <2s p95, dashboard loads <500ms p95, 99.9% uptime during 8am–8pm SAST, rate limits 100 req/min authenticated & 10 req/min unauthenticated  
**Constraints**: POPIA compliance (RLS, audit logging, data export/delete), encrypted OAuth tokens, tier-based quotas (posts/platforms/storage/users), RFC 7807 error format, reusable logging context, payable cost ceiling ~$0.30/user/month for AI  
**Scale/Scope**: Target 10k businesses, 10 concurrent users per enterprise account, 4 platform integrations (Facebook, Instagram, X/Twitter, LinkedIn), 35+ API endpoints, comprehensive analytics + chat assistant flows

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- `.specify/memory/constitution.md` contains placeholder headings without concrete principles; no binding constitutional constraints were defined.
- Default engineering guardrails adopted: TDD-first implementation, documentation for non-obvious logic, preference for simplicity (YAGNI), enforce review-quality logging + observability.
- No violations detected; both Initial and Post-Design gates pass with advisory note to formalize constitution in future revision.

## Project Structure

### Documentation (this feature)

```text
specs/001-purple-glow-social/
├── plan.md              # Implementation plan (this document)
├── research.md          # Phase 0 technology decisions & clarifications
├── data-model.md        # PostgreSQL schema, triggers, RLS policies
├── quickstart.md        # Environment setup & first end-to-end test
├── contracts/
│   └── openapi.yaml     # REST API contract for v1 endpoints
└── tasks.md             # Phase 2 task backlog (generated previously)
```

### Source Code (repository root excerpt)

```text
c:\scratchpad\PGS/
├── app/                         # Next.js App Router
│   ├── (auth)/…                 # Login + registration flows
│   ├── (dashboard)/…            # Authenticated dashboard routes
│   ├── api/v1/…                 # Route handlers for REST API
│   └── onboarding/…             # Multi-step onboarding wizard
├── components/                  # React components (ui, dashboard, chat, auth)
├── lib/
│   ├── supabase/…               # Supabase clients & middleware
│   ├── gemini/…                 # Google Gemini integration
│   ├── paystack/…               # Paystack API wrappers
│   ├── social-media/…           # Facebook/Instagram/Twitter/LinkedIn clients
│   ├── middleware/…             # CORS, rate limiting, logging helpers
│   └── validation/…             # Zod schemas for API validation
├── supabase/
│   ├── migrations/…             # SQL migrations (001–015)
│   └── seed.sql                 # Seed data for local dev
├── tests/
│   ├── setup.ts                 # Jest bootstrap (env, rate-limit reset)
│   ├── integration/…            # API integration test suites
│   └── unit/…                   # Component/function unit tests
├── scripts/                     # Supabase type generation, seeding helpers
└── .github/                     # CI workflows & Copilot instructions
```

**Structure Decision**: Single Next.js 14 App Router codebase with shared `lib/` service layer and Supabase backend artifacts. Server (Edge/API routes), client components, and infrastructure assets are colocated within the monorepo to support end-to-end feature work on branch `001-purple-glow-social`.

## Phase 0: Outline & Research

- Completed research (`research.md`, 2025-10-01) resolves previous NEEDS CLARIFICATION markers: Gemini pricing/provider, posting schedule strategy, security audit cadence, SLA target (99.9%), concurrency goals (10 users/account).
- Documented technology decisions across frontend (Next.js + Tailwind + Shadcn), backend (Supabase Auth/Postgres/Storage/Edge Functions), AI (Gemini text/image models), billing (Paystack), chat (CopilotKit), testing (Playwright).
- Included risk matrix (API changes, OAuth tokens, AI quality) with mitigations, performance guidelines, monitoring/observability strategy, and POPIA compliance controls.
- Output artifacts: `research.md` (decisions + rationale + alternatives), ensuring no remaining unknowns block design.

## Phase 1: Design & Contracts

- **Data Model**: `data-model.md` defines 10 core tables (users, business_profiles, social_media_accounts, posts, post_publications, analytics_records, subscriptions, billing_transactions, admin_users, chat_messages), triggers (updated_at, automation eligibility, tier limits), views (`v_content_calendar`, `v_analytics_summary`), and RLS policies satisfying POPIA.
- **API Contracts**: `contracts/openapi.yaml` enumerates versioned REST endpoints covering auth, onboarding, social connections, posts, analytics, subscriptions, admin, and webhooks—aligned with FR-001..FR-126.
- **Quickstart**: `quickstart.md` walks through environment setup, Supabase bootstrap, migrations, seeding, and first E2E onboarding scenario (Playwright).
- **Agent Context**: `.github/copilot-instructions.md` captures stack conventions, coding standards, and deployment workflows (kept under 150 lines).
- Design artifacts validated against research constraints; no outstanding clarifications remain.

## Phase 2: Task Planning Approach

- `tasks.md` already generated from Phase 1 artifacts (multi-phase backlog T001–T060).
- If re-generating, reuse `.specify/templates/tasks-template.md`, derive tasks from OpenAPI endpoints (contract tests first), data model entities (migration + model tasks), and user stories (integration + E2E coverage).
- Ordering: migrations → validation schemas → service layer → API routes → UI flows, respecting TDD (tests fail before implementation).
- Parallel markers `[P]` maintained for independent efforts (e.g., distinct platform integrations, UI components vs. background jobs).
- Outcome expectation: 25–30 granular tasks per phase, each mapping to acceptance criteria in spec.

## Phase 3+: Future Implementation

- **Phase 3**: Execute `/tasks` plan, iterating through tests → code → refactor loops.
- **Phase 4**: Implement feature slices (AI generation, calendar UI, analytics dashboards, billing flows).
- **Phase 5**: Validation sweep—run lint, type-check, unit/integration/E2E suites, verify Supabase migrations, and confirm SLA/rate-limiting metrics.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _None_    | —          | —                                    |

## Progress Tracking

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - approach described)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented (not required)

---

_Based on repository context; constitutional guardrails pending formal definition in `.specify/memory/constitution.md`_
