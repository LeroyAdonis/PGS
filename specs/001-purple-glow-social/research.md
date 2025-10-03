# Research: Purple Glow Social Technical Stack

**Feature**: Purple Glow Social - AI-Powered Social Media Manager  
**Date**: October 1, 2025  
**Phase**: 0 - Technology Research & Best Practices

## Executive Summary

This document consolidates research findings for technology choices, integration patterns, and best practices for building Purple Glow Social. All outstanding clarifications from the spec have been addressed through research, with recommendations provided for deployment decisions.

---

## Technology Stack Decisions

### 1. Frontend Framework: Next.js 14 (App Router)

**Decision**: Use Next.js 14 with App Router for the unified frontend application.

**Rationale**:

- **Server Components**: Reduce client-side JavaScript bundle size for faster page loads, critical for dashboard with heavy data (analytics, content calendar)
- **Server Actions**: Simplify data mutations without separate API routes, ideal for form submissions (onboarding, post editing)
- **Streaming & Suspense**: Progressive rendering for AI content generation (show skeleton while waiting for Gemini API response)
- **Built-in Optimization**: Automatic image optimization via `next/image`, font optimization, code splitting
- **Middleware**: Easy OAuth callback handling, route protection for authenticated/admin routes
- **SEO & Meta**: Server-side rendering for marketing pages (pricing, landing) improves SEO
- **Vercel Integration**: First-class deployment support with edge functions, automatic HTTPS, global CDN

**Alternatives Considered**:

- **Create React App**: Lacks SSR, requires separate backend for API routes, no edge function support
- **Remix**: Similar SSR benefits but smaller ecosystem, less mature Vercel deployment story
- **Vite + React**: Client-side only, would require separate Express/Fastify backend

**Best Practices**:

- Use App Router's route groups: `(auth)/` for protected routes, `(public)/` for unauthenticated
- Implement parallel routes for modal overlays (post preview, image editor)
- Leverage `loading.tsx` for instant loading states with Suspense boundaries
- Use Server Components by default, Client Components (`'use client'`) only when needed (chat interface, drag-drop calendar)
- Implement route handlers in `app/api/` for webhook endpoints (Paystack, social media)

**References**:

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Vercel Deployment Guide](https://vercel.com/docs/frameworks/nextjs)

---

### 2. UI Framework: Tailwind CSS + Shadcn UI

**Decision**: Tailwind CSS for styling with Shadcn UI component library.

**Rationale**:

- **Tailwind CSS**: Utility-first approach enables rapid UI development, responsive design with mobile-first breakpoints, excellent tree-shaking for production bundles
- **Shadcn UI**: Headless, accessible React components (built on Radix UI) with Tailwind styling, fully customizable (not a dependency, copied into codebase), includes complex components (Combobox for language selector, Calendar for content scheduling, Dialog for modals)
- **Dark Mode**: Built-in support via Tailwind's `dark:` variant, important for dashboard usability
- **Consistency**: Design tokens (colors, spacing, typography) defined in `tailwind.config.ts` ensure brand alignment
- **Performance**: No runtime CSS-in-JS overhead, all styles compiled at build time

**Alternatives Considered**:

- **Material-UI**: Heavy bundle size (~100KB), opinionated design system hard to customize for brand identity
- **Chakra UI**: Runtime CSS-in-JS adds performance overhead, less suitable for server components
- **Pure Tailwind**: Would require building complex components (date picker, dropdown) from scratch

**Best Practices**:

- Define brand colors in Tailwind config (`primary`, `secondary`, `accent` matching Purple Glow brand)
- Use Shadcn's theming system with CSS variables for light/dark mode support
- Implement responsive design mobile-first (`sm:`, `md:`, `lg:` breakpoints)
- Extract repeated component patterns into reusable components (e.g., `Card`, `Badge`, `Button`)
- Use Tailwind's JIT compiler for development (instant feedback on style changes)

**References**:

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Component Library](https://ui.shadcn.com/)

---

### 3. Backend: Supabase (Backend-as-a-Service)

**Decision**: Supabase for database, authentication, storage, and serverless functions.

**Rationale**:

- **PostgreSQL Database**: Robust relational database with JSONB support for flexible schema, built-in full-text search for post content, Row Level Security (RLS) for POPIA-compliant access control
- **Supabase Auth**: OAuth providers (Google, Facebook) for social login, JWT-based session management, email/password with password reset flows, role-based access control (business users vs. admins)
- **Supabase Storage**: S3-compatible object storage for user uploads (logos, generated images), tier-based storage limits (2GB/10GB/50GB) enforced via RLS policies
- **Edge Functions (Deno)**: Serverless functions for background jobs (cron scheduling, OAuth token refresh, analytics purging), TypeScript support out-of-box, fast cold starts (<50ms)
- **Realtime Subscriptions**: WebSocket support for live updates (new posts approved, analytics refreshed)
- **Local Development**: `supabase start` runs entire stack locally (Docker-based), enables offline dev and testing

**Alternatives Considered**:

- **Firebase**: No native PostgreSQL (Firestore is NoSQL, complex for relational data like subscriptions + billing), limited query capabilities, vendor lock-in
- **AWS Amplify**: Steeper learning curve, requires managing more infrastructure (Cognito + DynamoDB + S3 + Lambda separately)
- **Self-hosted PostgreSQL + Express**: Higher operational overhead (DB backups, scaling, security patches), slower development velocity

**Best Practices**:

- Enable Row Level Security (RLS) on all tables to enforce POPIA data access policies
- Use Supabase's type generator (`supabase gen types typescript`) for end-to-end type safety
- Implement database migrations for schema changes (version controlled in `supabase/migrations/`)
- Use connection pooling (PgBouncer) for high-concurrency scenarios
- Set up automated backups (daily full backup, point-in-time recovery for last 7 days)
- Implement rate limiting on Edge Functions to prevent abuse (e.g., max 60 AI generation requests/minute per user)

**References**:

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [PostgreSQL Best Practices for SaaS](https://www.postgresql.org/docs/current/index.html)

---

### 4. AI Integration: Google Gemini APIs

**Decision**: Google Gemini API for text generation, Gemini 2.5 Flash Image Preview (Nano Banana) for image generation.

**Rationale**:

- **Multilingual Support**: Gemini Pro supports all 11 South African languages (including Zulu, Xhosa, Afrikaans) natively, no need for separate translation services
- **Content Generation**: Gemini 1.5 Pro for high-quality social media post generation (captions, hashtags, CTAs), supports long context (1M tokens) for brand guideline input
- **Image Generation**: Gemini 2.5 Flash Image Preview model for generating brand-aligned social media images (1024x1024 resolution), supports prompts with brand colors, logo overlay
- **Function Calling**: Structured output for tool use (e.g., generate post → JSON with caption, hashtags, image_prompt)
- **Cost-Effective**: Gemini Pro pricing (~$0.00025/1K tokens input, $0.0005/1K tokens output) significantly cheaper than GPT-4 Turbo
- **Streaming**: Supports streaming responses for real-time UI updates (show post generation progress)
- **Safety Filters**: Built-in content moderation (hate speech, violence, explicit content) reduces platform policy violation risk

**Alternatives Considered**:

- **OpenAI GPT-4**: 3x more expensive, multilingual support exists but less optimized for African languages
- **Anthropic Claude**: No native image generation, would require separate service (DALL-E, Midjourney)
- **Open-source LLMs (Llama 3)**: Would require self-hosting infrastructure, higher operational complexity

**Best Practices**:

- Implement prompt templates with variables (business_name, industry, target_audience, tone, language)
- Use system instructions to enforce brand voice consistency: "You are a social media expert for {business_name}, a {industry} business. Generate posts in {language} with {tone} tone."
- Implement retry logic with exponential backoff for API failures (429 rate limits, 500 server errors)
- Cache generated content in database to reduce API costs (reuse similar prompts)
- Log all AI requests/responses for quality monitoring and future fine-tuning
- Set token limits per generation (max 500 tokens for captions to prevent overly long posts)
- Implement content filtering post-generation (check for policy violations, profanity, competitor mentions)

**References**:

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini Pricing](https://ai.google.dev/pricing)
- [Gemini Multimodal Capabilities](https://ai.google.dev/tutorials/multimodal_generation)

---

### 5. Payment Processing: Paystack

**Decision**: Paystack for subscription billing and payment processing.

**Rationale**:

- **South African Market**: Paystack specifically designed for African markets, supports ZAR (South African Rand) natively
- **Compliance**: PCI DSS Level 1 certified, POPIA-compliant data handling
- **Subscription Management**: Built-in recurring billing for monthly subscriptions (Starter, Growth, Enterprise tiers)
- **14-Day Free Trial**: Supports trial periods with automatic billing conversion after trial ends
- **Webhooks**: Real-time notifications for payment events (successful charge, failed charge, subscription cancelled)
- **Card Payments**: Supports all major South African card networks (Visa, Mastercard, American Express)
- **Mobile Money**: Optional integration with mobile payment methods (future expansion)
- **Dashboard**: Real-time revenue analytics, customer management, refund processing
- **Developer Experience**: Comprehensive API with SDKs (Node.js), test mode for development

**Alternatives Considered**:

- **Stripe**: Limited South African support, higher fees for cross-border transactions, less familiar to SA customers
- **PayFast**: South African payment gateway but weaker subscription billing features, no automatic trial-to-paid conversion
- **PayU**: Supports SA but less developer-friendly API, weaker documentation

**Best Practices**:

- Implement webhook verification (verify signature to prevent spoofing attacks)
- Store Paystack customer IDs and subscription IDs in database (link to user accounts)
- Handle all subscription states: `active`, `past_due` (retry failed payments), `cancelled` (prevent access)
- Implement grace period for failed payments (3-day retry window before suspending account)
- Send email notifications for billing events (payment success, payment failed, subscription expiring)
- Use Paystack's inline payment modal for seamless checkout experience (no redirect)
- Test subscription flows in Paystack test mode before production launch

**References**:

- [Paystack Documentation](https://paystack.com/docs)
- [Paystack Subscriptions Guide](https://paystack.com/docs/payments/subscriptions)
- [Paystack Webhooks](https://paystack.com/docs/payments/webhooks)

---

### 6. Social Media Integrations: OAuth + Platform APIs

**Decision**: Implement OAuth 2.0 authentication for each platform with direct API integration.

**Rationale**:

- **OAuth Security**: Industry-standard authorization protocol, users grant scoped permissions (read posts, publish posts, read analytics) without sharing passwords
- **Token Management**: Access tokens expire (Facebook: 60 days, Instagram: 60 days, X/Twitter: varies, LinkedIn: 60 days), refresh tokens used to obtain new access tokens automatically
- **Platform APIs**: Direct API calls for publishing (Facebook Graph API, Instagram Graph API, X API v2, LinkedIn Marketing API), analytics retrieval (engagement metrics, reach, impressions)
- **Rate Limits**: Each platform has rate limits (Facebook: 200 calls/hour, X: 300 tweets/3 hours), implement queue-based publishing with exponential backoff
- **Error Handling**: Platform APIs return specific error codes (token expired, post rejected, rate limit exceeded), handle gracefully with user notifications

**Platforms**:

1. **Facebook Graph API v18.0**: Publish posts to pages, retrieve page insights (likes, comments, shares, reach)
2. **Instagram Graph API**: Publish photo/video posts, retrieve media insights (likes, comments, saves)
3. **X/Twitter API v2**: Create tweets with media, retrieve tweet metrics (likes, retweets, replies)
4. **LinkedIn Marketing API**: Share posts to organization pages, retrieve post analytics (impressions, clicks, engagement)

**Best Practices**:

- Store OAuth tokens encrypted in Supabase (use `pgcrypto` extension for AES encryption at rest)
- Implement token refresh background job (Supabase Edge Function runs daily, refreshes expiring tokens)
- Handle OAuth errors gracefully: expired tokens → prompt user to reconnect, revoked access → notify via email
- Implement retry logic for API failures (3 retries with exponential backoff: 1s, 2s, 4s)
- Queue scheduled posts (store in database, background worker publishes at scheduled time)
- Validate post content before publishing (check character limits, image size requirements per platform)
- Log all API requests/responses for debugging and audit trail

**References**:

- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [X/Twitter API v2 Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [LinkedIn Marketing API Documentation](https://learn.microsoft.com/en-us/linkedin/marketing/)

---

### 7. Chat Interface: CopilotKit

**Decision**: CopilotKit for in-app AI chat assistant.

**Rationale**:

- **Natural Language Commands**: Users can type commands like "Generate 5 posts about our new product launch" or "Show me last month's engagement stats"
- **Context Awareness**: CopilotKit can access application state (user's business profile, connected platforms, post history) to provide contextual responses
- **Action Integration**: Connect chat commands to backend functions (generate posts, fetch analytics, schedule posts)
- **UI Components**: Pre-built React components for chat interface (message bubbles, input field, typing indicators)
- **Streaming**: Supports streaming responses from Gemini API (show AI thinking process)
- **Multi-turn Conversations**: Maintains conversation history for follow-up questions

**Alternatives Considered**:

- **Custom Chat Implementation**: Higher development effort, would require building message history, streaming, UI components from scratch
- **Chatbot Platforms (Dialogflow)**: Overkill for in-app assistant, designed for external customer support bots
- **Vercel AI SDK**: Good for streaming but lacks pre-built UI components and action system

**Best Practices**:

- Define clear chat commands with examples in UI ("Try: Generate 3 posts about our summer sale")
- Implement command parsing (regex or NLP) to extract intent and parameters
- Connect chat actions to existing backend functions (reuse AI generation logic)
- Show loading states during AI processing (typing indicator, skeleton UI)
- Limit conversation history (last 10 messages) to prevent token limit issues
- Implement rate limiting per user (max 30 chat commands/hour) to prevent abuse

**References**:

- [CopilotKit Documentation](https://docs.copilotkit.ai/)
- [CopilotKit React Components](https://docs.copilotkit.ai/components)

---

### 8. Testing: Chrome Dev Tools MCP (Playwright)

**Decision**: Chrome Dev Tools MCP for end-to-end testing and admin analytics tool.

**Rationale**:

- **Dual Purpose**: Use for both E2E testing (onboarding flow, content generation, publishing) AND admin "Lead Insights" tool (scrape public social media data)
- **Playwright Under the Hood**: Chrome Dev Tools MCP leverages Playwright for browser automation, provides headless Chromium for testing
- **Real Browser Testing**: Tests run in actual browser environment (not simulated), catches CSS issues, JavaScript errors, OAuth flows
- **Multi-browser Support**: Can test across Chromium, Firefox, WebKit (Safari) for cross-browser compatibility
- **Visual Testing**: Screenshot comparison for regression testing (detect UI changes)
- **Network Interception**: Mock API responses for testing edge cases (platform API failures, rate limits)

**Alternatives Considered**:

- **Cypress**: Popular but slower for large test suites, doesn't support multi-tab scenarios (needed for OAuth flows)
- **Selenium**: Older tech, slower startup time, less modern API
- **Pure Playwright**: Would need separate scraping tool for admin analytics feature

**Best Practices**:

- Organize tests by user flow (auth.spec.ts, onboarding.spec.ts, content-generation.spec.ts)
- Use Page Object Model pattern (abstract page interactions into reusable classes)
- Implement parallel test execution (run 4+ tests concurrently to speed up CI)
- Mock external APIs in tests (social media APIs, Gemini API) to avoid rate limits and flakiness
- Take screenshots on test failure for debugging
- Run tests in CI/CD pipeline (GitHub Actions) on every pull request

**References**:

- [Chrome Dev Tools MCP Documentation](https://modelcontextprotocol.io/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

---

### 9. Deployment: Vercel

**Decision**: Deploy on Vercel for frontend and serverless functions.

**Rationale**:

- **Next.js Integration**: First-class support for Next.js (same company), zero-config deployment
- **Edge Network**: Global CDN with 100+ edge locations for low-latency access (important for SA users)
- **Automatic HTTPS**: Free SSL certificates via Let's Encrypt, automatic renewal
- **Serverless Functions**: Next.js API routes automatically deploy as serverless functions (auto-scale to zero, pay per invocation)
- **Environment Variables**: Secure storage for secrets (Supabase keys, Gemini API keys, Paystack keys)
- **Preview Deployments**: Every pull request gets unique preview URL for testing before merge
- **Analytics**: Built-in Web Vitals monitoring (Core Web Vitals: LCP, FID, CLS)
- **Free Tier**: Generous free tier for early development (100GB bandwidth, 100 serverless function executions/day)

**Alternatives Considered**:

- **Netlify**: Similar to Vercel but less optimized for Next.js (slower build times)
- **AWS (EC2 + S3 + CloudFront)**: More control but significantly higher operational complexity (server management, load balancing, auto-scaling)
- **DigitalOcean App Platform**: Cheaper but slower deployment times, less mature edge network

**Best Practices**:

- Set up production and staging environments (separate Vercel projects)
- Configure environment variables in Vercel dashboard (never commit secrets to Git)
- Enable Vercel Analytics for performance monitoring
- Set up custom domain with DNS (purpleglow.social)
- Configure Vercel caching headers for static assets (1 year max-age)
- Use Vercel's Image Optimization for user-uploaded images (automatic WebP conversion, resizing)

**References**:

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

---

## Resolved Clarifications

### 1. AI Model Pricing and Provider

**Original Question**: Which AI provider should we use and what are the cost implications?

**Research Findings**:

- **Provider**: Google Gemini API (Gemini 1.5 Pro for text, Gemini 2.5 Flash Image Preview for images)
- **Pricing Estimate** (per user/month):
  - Text generation: ~120 posts/month × 500 tokens avg × $0.0005 per 1K tokens = **$0.03/user/month**
  - Image generation: ~120 posts/month × $0.002 per image = **$0.24/user/month**
  - Total AI cost: **~$0.27/user/month** (negligible compared to R499/999/1999 subscription prices)
- **Cost Optimization Strategies**:
  - Cache generated content in database (reuse similar prompts)
  - Implement rate limiting per tier (Starter: 30 posts/month, Growth: 120, Enterprise: unlimited but monitor usage)
  - Use streaming for better user experience without additional cost
  - Batch analytics processing instead of real-time (collect analytics once per hour, not per post)

**Recommendation**: Gemini API is cost-effective and technically superior (multilingual support) for this use case. Total AI costs <1% of subscription revenue, leaving 99% margin for other operational costs (Supabase, Vercel, support).

---

### 2. Optimal Posting Times Algorithm

**Original Question**: How should the system determine optimal posting times for each platform?

**Research Findings**:

- **Industry Default Times** (research-backed best times for each platform):
  - Facebook: Weekdays 1-4pm, Wednesday 11am-1pm
  - Instagram: Monday-Friday 9am-11am, Tuesday 11am-2pm
  - X/Twitter: Weekdays 8-10am, 6-9pm
  - LinkedIn: Tuesday-Thursday 9am-12pm, Wednesday 9am best
- **User-Specific Analytics** (future enhancement, Phase 2):
  - After 3 months of data: Analyze user's historical posts to find their audience's most active hours
  - Group by platform and day of week, calculate engagement rate per time slot
  - Update optimal times monthly based on rolling 90-day analytics window

**Recommendation**:

- **Phase 1 (MVP)**: Use industry default times hardcoded in backend (stored in database table `optimal_posting_times`)
- **Phase 2 (Future)**: Implement analytics-driven algorithm after 3 months of user data collected
- Allow manual override: Users can always customize posting schedule in settings

---

### 3. Security Audit Frequency

**Original Question**: How often should security audits be performed?

**Research Findings**:

- **Industry Standards**:
  - **SOC 2 Compliance**: Annual external audit (Type II report)
  - **Penetration Testing**: Quarterly for SaaS with PII/payment data
  - **Automated Scans**: Continuous (daily vulnerability scans via tools like Snyk, Dependabot)
- **POPIA Requirements**: Annual privacy impact assessment + incident response plan testing
- **Cost Considerations**:
  - External pentest: $5,000-$15,000 per audit (quarterly = $20K-$60K/year)
  - Automated tools: $500-$2,000/year (Snyk Pro, GitHub Advanced Security)

**Recommendation**:

- **MVP Phase**: Quarterly automated vulnerability scans (GitHub Dependabot + Snyk), annual external pentest
- **Production Phase** (after 1,000 users): Quarterly external pentest, continuous automated scans, annual SOC 2 audit
- Document all audits in `security/audits/` directory (reports, remediation plans)

---

### 4. Uptime SLA Confirmation

**Original Question**: Is 99.5% uptime during business hours (6am-10pm SAST) the correct SLA target?

**Research Findings**:

- **99.5% Uptime** = 43.8 minutes downtime/month during 16-hour business day
- **Industry Benchmarks**:
  - Consumer SaaS: 99.5% typical (Mailchimp, Hootsuite)
  - Enterprise SaaS: 99.9% (Buffer, Sprout Social) = 4.38 minutes downtime/month
  - Mission-critical: 99.95% (HubSpot) = 2.19 minutes downtime/month
- **Infrastructure Reliability**:
  - Vercel: 99.99% uptime SLA (Enterprise plan)
  - Supabase: 99.9% uptime SLA (Pro plan)
  - Combined system uptime: 99.89% (product of dependencies)

**Recommendation**:

- **Target SLA**: 99.9% uptime during business hours (4.38 minutes downtime/month)
- **Justification**: Feasible with current infrastructure (Vercel + Supabase), meets industry standards for SMB SaaS
- **Implementation**:
  - Set up uptime monitoring (UptimeRobot, Pingdom)
  - Alert on >1 minute downtime
  - Maintain status page (status.purpleglow.social)
  - SLA credits: 10% monthly fee refund per 0.1% below 99.9%

---

### 5. Concurrent User Capacity

**Original Question**: Should the system support up to 10 concurrent users per account based on subscription tier?

**Research Findings**:

- **Concurrency** = multiple users from same business account logged in simultaneously
- **Subscription Limits**:
  - Starter: 1 user (no concurrency needed)
  - Growth: 3 users (2-3 concurrent sessions typical)
  - Enterprise: 10 users (5-7 concurrent sessions typical)
- **Technical Implications**:
  - Supabase Auth: Supports unlimited concurrent sessions per user (JWT-based, stateless)
  - WebSocket connections: Supabase Realtime supports 1,000 concurrent connections per project (sufficient for 100 Enterprise accounts × 10 users)
  - Database connections: PgBouncer connection pooling handles 1,000+ concurrent queries
- **Conflict Resolution**:
  - Implement optimistic locking for post edits (last-write-wins)
  - Show real-time notifications when another user is editing same post (via Supabase Realtime)

**Recommendation**:

- **Support 10 concurrent users per account** (Enterprise tier limit)
- **Implementation**:
  - No additional infrastructure needed (Supabase handles it)
  - Add UI notification when multiple users edit same post
  - Log concurrent user sessions in analytics (monitor for abuse)

---

## Best Practices Summary

### Security & Compliance

1. **POPIA Compliance**:
   - Implement Row Level Security (RLS) on all Supabase tables
   - Encrypt OAuth tokens at rest (pgcrypto)
   - Provide data export and deletion features (user rights)
   - Log all data access (audit trail)
   - Display Privacy Policy during registration (explicit consent)

2. **Authentication**:
   - Use Supabase Auth for JWT-based sessions (stateless, scalable)
   - Implement email verification on registration
   - Support password reset via email
   - Rate limit login attempts (5 attempts per 15 minutes)
   - Use secure cookies (httpOnly, secure, sameSite)

3. **API Security**:
   - Rate limit all API endpoints (100 requests/minute per user)
   - Validate all inputs (Zod schemas)
   - Sanitize outputs (prevent XSS)
   - Use HTTPS for all requests (Vercel enforces)
   - Implement CSRF protection (Next.js built-in)

### Performance Optimization

1. **Database**:
   - Index frequently queried columns (user_id, business_profile_id, scheduled_time, created_at)
   - Use database views for complex analytics queries
   - Implement query caching (Supabase PostgREST)
   - Archive old analytics data (6-month retention policy)

2. **Frontend**:
   - Use Next.js Image component for automatic optimization
   - Implement lazy loading for content calendar (virtualized list)
   - Code split by route (automatic with App Router)
   - Prefetch navigation routes (next/link)
   - Use Server Components for static content

3. **API Integration**:
   - Cache social media API responses (1-hour TTL)
   - Batch analytics retrieval (hourly cron job)
   - Queue post publishing (background worker)
   - Implement circuit breaker for failing APIs (stop retrying after 3 failures)

### Development Workflow

1. **Local Development**:
   - Use Supabase local dev (`supabase start`)
   - Mock external APIs in tests (Gemini, Paystack, social media)
   - Use environment variables for all secrets (never hardcode)
   - Run linting and formatting on pre-commit hook (ESLint, Prettier)

2. **Testing Strategy**:
   - Unit tests for utilities and business logic (Jest)
   - Integration tests for API routes (Supabase queries)
   - E2E tests for critical flows (onboarding, content generation, publishing)
   - Visual regression tests for UI components (Playwright screenshots)

3. **CI/CD**:
   - Run tests on every pull request (GitHub Actions)
   - Deploy preview to Vercel on PR creation
   - Deploy to production on merge to main (automatic)
   - Run database migrations via Supabase CLI in CI

### Monitoring & Observability

1. **Application Monitoring**:
   - Log all errors to error tracking service (Sentry)
   - Track key metrics: AI generation success rate, post publish success rate, OAuth token refresh success rate
   - Set up alerts for critical failures (database down, AI API error rate >10%)

2. **Business Metrics**:
   - Track subscription conversions (trial → paid)
   - Monitor churn rate (cancelled subscriptions)
   - Measure user engagement (posts generated per user per month)
   - Track platform usage distribution (Facebook vs. Instagram vs. X vs. LinkedIn)

3. **Cost Monitoring**:
   - Track AI API costs per user (Gemini API usage)
   - Monitor Supabase storage usage (warn at 80% of plan limit)
   - Track Vercel bandwidth usage (avoid overage charges)

---

## Technology Risk Assessment

### High Risk (Mitigation Required)

1. **Social Media API Changes**: Platforms frequently update APIs, breaking integrations
   - **Mitigation**: Version APIs explicitly, subscribe to developer newsletters, implement API version detection
2. **OAuth Token Management**: Token expiration causes publishing failures
   - **Mitigation**: Implement robust token refresh logic, background job runs daily, notify users before token expires

3. **AI Content Quality**: Generated posts may not meet user expectations
   - **Mitigation**: Implement feedback loop (user edits train model), human review for first 10 posts, provide regeneration option

### Medium Risk (Monitor)

1. **Rate Limiting**: Platform APIs have strict rate limits
   - **Mitigation**: Implement queue-based publishing, spread requests over time, exponential backoff on rate limit errors

2. **Cost Overruns**: AI API costs could spike with heavy usage
   - **Mitigation**: Enforce tier-based limits, monitor per-user costs, implement circuit breaker at $10/user/month threshold

3. **Multi-language Quality**: AI may generate poor quality content in less-common South African languages
   - **Mitigation**: Test with native speakers during beta, collect user feedback per language, improve prompts iteratively

### Low Risk (Acceptable)

1. **Vercel/Supabase Downtime**: Rare but possible infrastructure outages
   - **Mitigation**: Rely on vendor SLAs, implement status page, communicate downtime to users

2. **Browser Compatibility**: Next.js App Router requires modern browsers
   - **Mitigation**: Document minimum browser versions, graceful degradation for older browsers

---

## Next Steps

With research complete, proceed to **Phase 1: Design & Contracts**:

1. Generate `data-model.md` with PostgreSQL schema for all entities
2. Create `contracts/` directory with API endpoint definitions (OpenAPI spec)
3. Generate `quickstart.md` with setup instructions and first test scenario
4. Update `.github/copilot-instructions.md` with tech stack and conventions

**Phase 0 Status**: ✅ COMPLETE

All outstanding clarifications resolved. Technology stack finalized and best practices documented. No blockers for Phase 1 design.
