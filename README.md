# Purple Glow Social

AI-Powered Social Media Manager for South African Businesses

![Purple Glow Social](https://img.shields.io/badge/Next.js-14.2-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8) ![License](https://img.shields.io/badge/License-Proprietary-red)

---

## 🌟 Overview

Purple Glow Social is a SaaS platform that helps South African businesses automate their social media presence. Generate engaging posts with AI-created images in 11 South African languages, schedule content across Facebook, Instagram, X/Twitter, and LinkedIn, and track performance with comprehensive analytics.

### Key Features

- **AI Content Generation**: Create posts in 11 SA languages using Google Gemini AI
- **AI Image Creation**: Generate custom images with Google Gemini 2.5 Flash
- **Multi-Platform Publishing**: Post to Facebook, Instagram, X/Twitter, LinkedIn
- **Content Calendar**: Visual scheduling with drag-and-drop interface
- **Analytics Dashboard**: Track engagement metrics across all platforms
- **Team Collaboration**: Multi-user accounts with role-based permissions
- **Subscription Plans**: Flexible pricing (Starter R499/mo, Growth R999/mo, Enterprise R1999/mo)
- **POPIA Compliant**: Full South African data protection compliance

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0
- **Supabase CLI**: Latest version ([install guide](https://supabase.com/docs/guides/cli))
- **Google Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Paystack Account**: Sign up at [paystack.com](https://paystack.com)

### Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd PGS
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys (see Configuration section)
   ```

4. **Start local Supabase**:

   ```bash
   supabase start
   ```

5. **Run database migrations**:

   ```bash
   supabase db reset
   ```

6. **Generate TypeScript types**:

   ```bash
   npm run db:types
   ```

7. **Start development server**:

   ```bash
   npm run dev
   ```

8. **Open your browser**: Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
purple-glow-social/
├── app/                     # Next.js 14 App Router
│   ├── (auth)/             # Authentication routes (login, register)
│   ├── (dashboard)/        # Protected dashboard routes
│   ├── (admin)/            # Admin-only routes
│   ├── api/                # REST API routes
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/             # React components
│   ├── ui/                 # Shadcn UI primitives
│   ├── auth/               # Auth forms
│   ├── dashboard/          # Dashboard components
│   └── chat/               # CopilotKit chat interface
├── lib/                    # Utilities & services
│   ├── supabase/           # Supabase client & types
│   ├── gemini/             # Google Gemini API
│   ├── paystack/           # Paystack API
│   ├── social-media/       # Social platform integrations
│   ├── validation/         # Zod schemas
│   └── utils.ts            # Helper functions
├── supabase/               # Supabase configuration
│   ├── migrations/         # Database migrations
│   └── functions/          # Edge Functions
├── tests/                  # Test files
│   ├── unit/               # Jest unit tests
│   ├── integration/        # API integration tests
│   └── e2e/                # Playwright E2E tests
└── specs/                  # Feature specifications
    └── 001-purple-glow-social/
        ├── spec.md
        ├── plan.md
        ├── data-model.md
        ├── quickstart.md
        └── contracts/openapi.yaml
```

---

## 🔧 Configuration

Create a `.env.local` file with the following variables (see `.env.example` for template):

### Supabase

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Google Gemini AI

```bash
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_PROJECT_ID=your_google_project_id
```

### Paystack (ZAR Billing)

```bash
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret
```

### Social Media OAuth (see quickstart.md for setup guides)

```bash
# Facebook
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/auth/facebook/callback

# Instagram (via Facebook)
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/auth/instagram/callback

# X/Twitter
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
TWITTER_REDIRECT_URI=http://localhost:3000/api/auth/twitter/callback

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/linkedin/callback
```

### App Configuration

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript type checking
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting

# Database
npm run db:types         # Generate TypeScript types from Supabase schema
npm run db:seed          # Seed database with test data

# Testing
npm test                 # Run Jest unit tests
npm run test:watch       # Run Jest in watch mode
npm run test:e2e         # Run Playwright E2E tests
npm run test:all         # Run all tests + type-check + lint
```

### Code Conventions

- **TypeScript**: Strict mode enabled, prefer `interface` over `type`
- **React**: Functional components only, Server Components by default
- **Styling**: Tailwind CSS utility classes, Shadcn UI components
- **API**: REST with RFC 7807 Problem Details for errors
- **Testing**: Jest (unit), Playwright (E2E), React Testing Library (components)

---

## 📊 Database Schema

10 tables with Row Level Security (RLS) enabled:

- `users` - User accounts (auth via Supabase Auth)
- `business_profiles` - Business information (name, tone, topics)
- `social_media_accounts` - Connected platforms (OAuth tokens)
- `posts` - Generated content (captions, images, status)
- `post_publications` - Publication records per platform
- `analytics_records` - Engagement metrics (likes, shares, comments)
- `subscriptions` - Active plans (Starter/Growth/Enterprise)
- `billing_transactions` - Payment history
- `admin_users` - Admin permissions
- `chat_messages` - CopilotKit chat history

See `specs/001-purple-glow-social/data-model.md` for full schema.

---

## 🧪 Testing

### Unit Tests

```bash
npm test -- lib/gemini/text-generation.test.ts
```

### E2E Tests

```bash
npm run test:e2e -- tests/e2e/auth.spec.ts
```

### Run All Tests

```bash
npm run test:all
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub**:

   ```bash
   git push origin 001-purple-glow-social
   ```

2. **Connect to Vercel**:
   - Import repository at [vercel.com/new](https://vercel.com/new)
   - Set environment variables (all vars from `.env.local`)
   - Deploy

3. **Configure Supabase**:
   - Apply migrations to production database
   - Update `NEXT_PUBLIC_APP_URL` to production URL
   - Configure OAuth redirect URIs with production domain

4. **Configure Paystack**:
   - Update webhook URL to `https://yourdomain.com/api/webhooks/paystack`
   - Switch to live API keys

### Environment Checklist

- [ ] All environment variables set in Vercel
- [ ] Supabase migrations applied to production
- [ ] OAuth redirect URIs configured with production domain
- [ ] Paystack webhook URL updated
- [ ] DNS configured (if using custom domain)
- [ ] Test authentication flows
- [ ] Test social media connections
- [ ] Verify AI generation works
- [ ] Check analytics collection

---

## 📖 Documentation

- **Feature Specification**: `specs/001-purple-glow-social/spec.md`
- **Implementation Plan**: `specs/001-purple-glow-social/plan.md`
- **Database Schema**: `specs/001-purple-glow-social/data-model.md`
- **API Reference**: `specs/001-purple-glow-social/contracts/openapi.yaml`
- **Setup Guide**: `specs/001-purple-glow-social/quickstart.md`
- **Task List**: `specs/001-purple-glow-social/tasks.md`

---

## 🔐 Security

- **POPIA Compliant**: Row Level Security, encrypted OAuth tokens, audit logs
- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Role-based access control (user, business_admin, team_member, admin)
- **Rate Limiting**: 100 req/min per user, 10 req/min per IP (unauthenticated)
- **Security Headers**: HSTS, X-Frame-Options, CSP, X-Content-Type-Options

---

## 🐛 Troubleshooting

### Dev server won't start

- Check Node.js version: `node -v` (should be >= 20.0.0)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Next.js cache: `rm -rf .next`

### Database connection errors

- Ensure Supabase is running: `supabase status`
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

### TypeScript errors

- Regenerate types: `npm run db:types`
- Restart TypeScript server in VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"

### OAuth connection fails

- Verify redirect URIs match exactly (including trailing slashes)
- Check API keys are for correct environment (test vs production)
- Ensure OAuth apps have required scopes enabled

---

## 📄 License

Proprietary - All Rights Reserved

---

## 👥 Support

For issues or questions, contact the development team or see documentation in `specs/001-purple-glow-social/`.

**Status**: Phase 3.1 Complete (T001 Setup) - Ready for T002-T007
