# Purple Glow Social - Development Quickstart

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20.x or higher ([Download](https://nodejs.org/))
- **pnpm**: Version 8.x or higher
  ```powershell
  npm install -g pnpm@8
  ```
- **Git**: For version control ([Download](https://git-scm.com/))
- **Supabase CLI**: For local development (optional but recommended)
  ```powershell
  npm install -g supabase
  ```
- **Docker Desktop** (optional): For local Supabase instance
  - Only required if you want to run Supabase locally instead of using cloud
  - [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Development Environment Options

You can develop against either:

1. **Supabase Cloud** (recommended for getting started quickly)
2. **Local Supabase** (recommended for offline development)

This guide covers both approaches.

---

## Initial Setup

### 1. Clone the Repository

```powershell
git clone <repository-url>
cd pgs
```

### 2. Install Dependencies

```powershell
pnpm install
```

### 3. Environment Configuration

Create environment files for both development and local testing:

#### `.env.local` (for Next.js)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Google Gemini AI
GEMINI_API_KEY=<your-gemini-api-key>

# Social Media API Keys
FACEBOOK_APP_ID=<your-facebook-app-id>
FACEBOOK_APP_SECRET=<your-facebook-app-secret>
INSTAGRAM_APP_ID=<your-instagram-app-id>
INSTAGRAM_APP_SECRET=<your-instagram-app-secret>
TWITTER_API_KEY=<your-twitter-api-key>
TWITTER_API_SECRET=<your-twitter-api-secret>
TWITTER_BEARER_TOKEN=<your-twitter-bearer-token>
LINKEDIN_CLIENT_ID=<your-linkedin-client-id>
LINKEDIN_CLIENT_SECRET=<your-linkedin-client-secret>

# Paystack (Payment Gateway)
PAYSTACK_PUBLIC_KEY=<your-paystack-public-key>
PAYSTACK_SECRET_KEY=<your-paystack-secret-key>

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Option 1: Supabase Cloud Setup (Recommended for Quick Start)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com/)
2. Create a new project
3. Wait for project to provision (~2 minutes)
4. Navigate to **Settings → API** to get your keys

### 2. Configure Environment Variables

Update `.env.local` with your Supabase project credentials:

- `NEXT_PUBLIC_SUPABASE_URL`: Your project URL (e.g., `https://abcdefgh.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (keep secret!)

### 3. Run Database Migrations

```powershell
# Link your local project to Supabase cloud
supabase link --project-ref <your-project-ref>

# Push database schema
supabase db push
```

### 4. Seed Initial Data (Optional)

```powershell
supabase db seed
```

---

## Option 2: Local Supabase Setup (For Offline Development)

### 1. Start Local Supabase

```powershell
# Initialize Supabase (first time only)
supabase init

# Start local Supabase stack
supabase start
```

This will start:

- PostgreSQL database on `postgresql://postgres:postgres@localhost:54322/postgres`
- Supabase Studio on `http://localhost:54323`
- Auth server
- Storage server
- Realtime server
- Edge Functions runtime

### 2. Configure Local Environment

Update `.env.local` with local Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>
```

**Note**: The keys are printed in terminal when you run `supabase start`.

### 3. Apply Migrations

```powershell
# Migrations are automatically applied when starting local Supabase
# To manually apply:
supabase db reset
```

---

## API Key Setup

### Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `.env.local` as `GEMINI_API_KEY`

### Social Media APIs

#### Facebook & Instagram

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login and Instagram Graph API products
4. Copy App ID and App Secret to `.env.local`
5. Configure OAuth redirect URI: `http://localhost:3000/api/auth/callback/facebook`

#### Twitter (X)

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app with OAuth 2.0
3. Add API Key, API Secret, and Bearer Token to `.env.local`
4. Configure callback URL: `http://localhost:3000/api/auth/callback/twitter`

#### LinkedIn

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create a new app
3. Request access to Marketing Developer Platform
4. Add Client ID and Client Secret to `.env.local`
5. Configure redirect URL: `http://localhost:3000/api/auth/callback/linkedin`

### Paystack

1. Go to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Navigate to **Settings → API Keys & Webhooks**
3. Copy Public Key and Secret Key to `.env.local`
4. For local testing, use test keys (start with `pk_test_` and `sk_test_`)

---

## Running the Application

### 1. Start Development Server

```powershell
pnpm dev
```

The application will be available at: [http://localhost:3000](http://localhost:3000)

### 2. Access Supabase Studio

- **Cloud**: `https://app.supabase.com/project/<your-project-ref>`
- **Local**: `http://localhost:54323`

### 3. View Supabase Logs (Local Only)

```powershell
supabase logs
```

---

## Development Workflow

### Database Changes

#### Creating a New Migration

```powershell
# Generate migration from schema changes
supabase db diff -f <migration-name>

# Or create empty migration
supabase migration new <migration-name>
```

#### Applying Migrations

```powershell
# Local
supabase db reset

# Cloud
supabase db push
```

### Edge Functions

#### Create New Edge Function

```powershell
supabase functions new <function-name>
```

#### Deploy Edge Function

```powershell
# Deploy to cloud
supabase functions deploy <function-name>

# Set secrets
supabase secrets set GEMINI_API_KEY=<your-key>
```

#### Test Edge Function Locally

```powershell
supabase functions serve <function-name>
```

### Testing

#### Unit & Integration Tests (Vitest)

```powershell
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

#### End-to-End Tests (Playwright)

```powershell
# Install Playwright browsers (first time only)
pnpm playwright install

# Run E2E tests
pnpm test:e2e

# Run E2E tests in UI mode
pnpm test:e2e:ui
```

---

## Project Structure Overview

```
pgs/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login, signup)
│   ├── (dashboard)/              # Protected dashboard routes
│   ├── api/                      # API routes
│   │   ├── auth/                 # OAuth callbacks
│   │   ├── content/              # Content generation
│   │   └── webhooks/             # Payment webhooks
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── ui/                       # Shadcn UI components
│   ├── content/                  # Content management components
│   ├── analytics/                # Analytics components
│   └── settings/                 # Settings components
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Middleware client
│   ├── gemini/                   # Gemini AI service
│   ├── social/                   # Social media integrations
│   ├── paystack/                 # Payment integration
│   └── validations/              # Zod schemas
├── supabase/                     # Supabase configuration
│   ├── migrations/               # Database migrations
│   ├── seed.sql                  # Seed data
│   └── config.toml               # Supabase config
├── tests/                        # Test files
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # Playwright E2E tests
├── public/                       # Static assets
└── specs/                        # Feature specifications
```

---

## Common Tasks

### Adding a New Feature

1. Create feature branch: `git checkout -b feature/<feature-name>`
2. Update data model if needed (create migration)
3. Create API routes in `app/api/`
4. Create UI components in `components/`
5. Add validation schemas in `lib/validations/`
6. Write tests in `tests/`
7. Update OpenAPI spec in `specs/*/contracts/openapi.yaml`

### Database Development

```powershell
# View current database
supabase db dump

# Reset database to clean state
supabase db reset

# Run specific migration
supabase migration up
```

### Debugging

#### Enable Verbose Logging

```env
# Add to .env.local
NEXT_PUBLIC_LOG_LEVEL=debug
```

#### View Database Queries

```powershell
# Supabase logs
supabase logs db
```

#### Debug Edge Functions

```powershell
# Tail function logs
supabase functions logs <function-name> --follow
```

---

## Troubleshooting

### Port Already in Use

```powershell
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Supabase Connection Issues

```powershell
# Check Supabase status
supabase status

# Restart Supabase
supabase stop
supabase start
```

### Node Module Issues

```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item -Force pnpm-lock.yaml
pnpm install
```

### Migration Conflicts

```powershell
# Pull latest migrations from cloud
supabase db pull

# Resolve conflicts manually in supabase/migrations/
# Then reset local database
supabase db reset
```

---

## Additional Resources

### Documentation

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase Docs](https://supabase.com/docs)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Shadcn UI Components](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Paystack API Docs](https://paystack.com/docs/api/)

### Social Media API Docs

- [Meta Graph API](https://developers.facebook.com/docs/graph-api/)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api/)
- [Twitter API v2](https://developer.twitter.com/en/docs/twitter-api)
- [LinkedIn Marketing API](https://docs.microsoft.com/en-us/linkedin/marketing/)

### Development Tools

- [Supabase Studio](http://localhost:54323) (local)
- [Postman](https://www.postman.com/) - API testing
- [TablePlus](https://tableplus.com/) - Database GUI
- [VS Code Extensions](https://code.visualstudio.com/):
  - Tailwind CSS IntelliSense
  - Prettier
  - ESLint
  - Supabase

---

## Getting Help

### Project Documentation

- Feature specifications: `specs/<feature-id>/spec.md`
- Implementation plans: `specs/<feature-id>/plan.md`
- Data models: `specs/<feature-id>/data-model.md`
- API contracts: `specs/<feature-id>/contracts/openapi.yaml`

### Support Channels

- Internal team chat
- GitHub issues (for bug reports)
- Architecture decisions: `docs/adr/`

---

## Next Steps

Once your environment is set up:

1. **Complete onboarding flow**: Test user signup and business profile creation
2. **Connect social accounts**: Test OAuth flows for each platform
3. **Generate content**: Test AI content generation with Gemini
4. **Schedule posts**: Test post approval and scheduling workflow
5. **Review analytics**: Test analytics sync and dashboard

Happy coding! 🎉
