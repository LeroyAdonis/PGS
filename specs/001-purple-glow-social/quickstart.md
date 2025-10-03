# Quickstart Guide: Purple Glow Social

**Feature**: Purple Glow Social - AI-Powered Social Media Manager  
**Branch**: 001-purple-glow-social  
**Phase**: 1 - Design & Contracts  
**Last Updated**: October 1, 2025

---

## Prerequisites

Before starting development, ensure you have the following installed:

- **Node.js**: v20.x or later ([download](https://nodejs.org/))
- **npm**: v10.x or later (bundled with Node.js)
- **Git**: Latest version ([download](https://git-scm.com/))
- **VS Code**: Recommended IDE ([download](https://code.visualstudio.com/))
- **Docker Desktop**: For local Supabase (optional but recommended) ([download](https://www.docker.com/products/docker-desktop/))
- **Supabase CLI**: For database management ([docs](https://supabase.com/docs/guides/cli))

### Required Accounts

1. **Supabase**: Cloud database and auth ([signup](https://supabase.com/))
2. **Google Cloud**: For Gemini AI API ([console](https://console.cloud.google.com/))
3. **Paystack**: Payment processing ([signup](https://paystack.com/))
4. **Social Media Developer Apps** (for OAuth testing):
   - Facebook App ([developers.facebook.com](https://developers.facebook.com/))
   - Instagram (uses Facebook App)
   - X/Twitter App ([developer.twitter.com](https://developer.twitter.com/))
   - LinkedIn App ([developer.linkedin.com](https://www.linkedin.com/developers/))
5. **Vercel**: Deployment ([signup](https://vercel.com/)) - optional for MVP

---

## Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/PGS.git
cd PGS
git checkout 001-purple-glow-social
```

### 2. Install Dependencies

```bash
npm install
```

**Expected dependencies** (will be added during task execution):

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/auth-helpers-nextjs": "^0.9.0",
    "@google-cloud/vertexai": "^1.0.0",
    "copilotkit": "^1.0.0",
    "zod": "^3.22.0",
    "axios": "^1.6.0",
    "date-fns": "^3.0.0",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.312.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.3.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.1.0",
    "prettier": "^3.2.0",
    "@playwright/test": "^1.41.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.0"
  }
}
```

### 3. Environment Configuration

Create `.env.local` file in project root:

```bash
cp .env.example .env.local
```

**Required environment variables**:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini API
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GEMINI_API_KEY=your-gemini-api-key

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your-secret-key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your-public-key

# Social Media OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
INSTAGRAM_APP_ID=same-as-facebook
INSTAGRAM_APP_SECRET=same-as-facebook
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1

# Security
ENCRYPTION_KEY=your-32-char-encryption-key-for-tokens
JWT_SECRET=your-jwt-secret-for-supabase

# Feature Flags (optional)
ENABLE_CHAT_ASSISTANT=true
ENABLE_IMAGE_GENERATION=true
```

### 4. Initialize Supabase Locally (Recommended)

```bash
# Initialize Supabase project
supabase init

# Start local Supabase instance (PostgreSQL, Auth, Storage)
supabase start

# This will output local credentials:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Service Role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Update `.env.local` with local Supabase URLs:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase-start>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-supabase-start>
```

### 5. Run Database Migrations

```bash
# Apply migrations (create tables, triggers, RLS policies)
supabase db reset

# Verify migration success
supabase db diff

# Seed initial data (admin user, test users)
npm run db:seed
```

**Seed script** (`scripts/seed.ts`) will create:

- Admin user: `admin@purpleglowsocial.com` / `Admin123!`
- Test user: `test@example.com` / `Test123!`
- Sample business profile with social accounts

### 6. Generate TypeScript Types from Database

```bash
# Generate Supabase types
supabase gen types typescript --local > lib/supabase/types.ts

# Verify types were generated
cat lib/supabase/types.ts
```

### 7. Start Development Server

```bash
npm run dev
```

Application will be available at: [http://localhost:3000](http://localhost:3000)

---

## First Test Scenario: End-to-End User Onboarding

This scenario validates the complete user registration and onboarding flow, including:

1. User registration
2. Email verification (simulated)
3. Business profile creation
4. Social media account connection (mocked OAuth)
5. First AI post generation

### Step 1: Register New User

**Manual Testing**:

1. Navigate to [http://localhost:3000/auth/register](http://localhost:3000/auth/register)
2. Fill in registration form:
   - Email: `newuser@example.com`
   - Password: `SecurePass123!`
   - Display Name: `John Doe`
3. Click "Register"
4. Expected: Redirect to `/onboarding` with session cookie

**Automated E2E Test** (Playwright):

```typescript
// tests/e2e/onboarding.spec.ts
import { test, expect } from '@playwright/test'

test.describe('User Onboarding Flow', () => {
  test('should complete full onboarding process', async ({ page }) => {
    // 1. Register
    await page.goto('/auth/register')
    await page.fill('input[name="email"]', 'newuser@example.com')
    await page.fill('input[name="password"]', 'SecurePass123!')
    await page.fill('input[name="display_name"]', 'John Doe')
    await page.click('button[type="submit"]')

    // 2. Verify redirect to onboarding
    await expect(page).toHaveURL('/onboarding')

    // 3. Fill business profile
    await page.fill('input[name="business_name"]', 'Acme Corp')
    await page.selectOption('select[name="industry"]', 'Technology')
    await page.fill(
      'textarea[name="target_audience"]',
      'Small businesses looking for software solutions'
    )
    await page.fill('input[name="primary_color"]', '#6B46C1')
    await page.selectOption('select[name="content_tone"]', 'professional')
    await page.fill('input[name="content_topics"]', 'software, productivity, automation')
    await page.selectOption('select[name="preferred_language"]', 'en')
    await page.click('button:has-text("Next")')

    // 4. Connect social account (mocked OAuth)
    await page.click('button:has-text("Connect Facebook")')
    // OAuth mock will auto-complete and return to app
    await expect(page.locator('.toast')).toContainText('Facebook connected successfully')

    // 5. Skip to dashboard
    await page.click('button:has-text("Go to Dashboard")')
    await expect(page).toHaveURL('/dashboard')

    // 6. Verify welcome state
    await expect(page.locator('h1')).toContainText('Welcome to Purple Glow Social')
    await expect(page.locator('.subscription-badge')).toContainText('Trial')
  })
})
```

### Step 2: Create Business Profile

**API Request**:

```bash
curl -X POST http://localhost:3000/api/v1/business-profiles \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Acme Corp",
    "industry": "Technology",
    "target_audience": "Small businesses looking for software solutions",
    "primary_color": "#6B46C1",
    "secondary_color": "#EC4899",
    "content_tone": "professional",
    "content_topics": ["software", "productivity", "automation"],
    "preferred_language": "en",
    "posting_frequency": "daily"
  }'
```

**Expected Response** (201 Created):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "owner_user_id": "123e4567-e89b-12d3-a456-426614174000",
  "business_name": "Acme Corp",
  "industry": "Technology",
  "target_audience": "Small businesses looking for software solutions",
  "brand_logo_url": null,
  "primary_color": "#6B46C1",
  "secondary_color": "#EC4899",
  "content_tone": "professional",
  "content_topics": ["software", "productivity", "automation"],
  "preferred_language": "en",
  "posting_frequency": "daily",
  "automation_enabled": false,
  "automation_eligible_at": null,
  "approved_posts_count": 0,
  "created_at": "2025-10-01T10:00:00Z",
  "updated_at": "2025-10-01T10:00:00Z"
}
```

### Step 3: Connect Social Media Account (Mocked)

**OAuth Flow** (for development, use mocked responses):

```bash
# Initiate Facebook OAuth
curl http://localhost:3000/api/v1/social-accounts/facebook/connect \
  -H "Authorization: Bearer <access_token>"
```

**Response**:

```json
{
  "oauth_url": "http://localhost:3000/api/v1/mock-oauth/facebook?state=abc123",
  "state": "abc123"
}
```

**Mock OAuth Callback** (auto-redirects in dev):

```
GET http://localhost:3000/api/v1/social-accounts/facebook/callback?code=mock_code&state=abc123
```

**Expected**: Redirect to `/dashboard` with success toast.

### Step 4: Generate First AI Post

**API Request**:

```bash
curl -X POST http://localhost:3000/api/v1/posts \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Launching our new productivity app",
    "platform_targets": ["facebook", "instagram"],
    "generate_image": true
  }'
```

**Expected Response** (201 Created):

```json
{
  "id": "660f9511-f3ac-52e5-b827-557766551111",
  "business_profile_id": "550e8400-e29b-41d4-a716-446655440000",
  "caption": "🚀 Exciting news! We're thrilled to announce the launch of our new productivity app designed to help small businesses streamline their workflows. Say goodbye to manual tasks and hello to automation! Learn more at our website. #ProductivityApp #BusinessTools #Automation",
  "language": "en",
  "image_url": "https://supabase-storage-url.com/posts/660f9511-f3ac-52e5-b827-557766551111.png",
  "image_prompt": "A modern office workspace with a laptop displaying a productivity dashboard, bright colors, professional",
  "hashtags": ["ProductivityApp", "BusinessTools", "Automation"],
  "platform_targets": ["facebook", "instagram"],
  "status": "pending",
  "scheduled_time": null,
  "published_at": null,
  "created_at": "2025-10-01T10:05:00Z",
  "updated_at": "2025-10-01T10:05:00Z",
  "user_edits": [],
  "ai_model_version": "gemini-1.5-pro-latest"
}
```

### Step 5: Approve and Publish Post

**Approve Post**:

```bash
curl -X POST http://localhost:3000/api/v1/posts/660f9511-f3ac-52e5-b827-557766551111/approve \
  -H "Authorization: Bearer <access_token>"
```

**Publish Immediately**:

```bash
curl -X POST http://localhost:3000/api/v1/posts/660f9511-f3ac-52e5-b827-557766551111/publish \
  -H "Authorization: Bearer <access_token>"
```

**Expected Response**:

```json
{
  "post": {
    "id": "660f9511-f3ac-52e5-b827-557766551111",
    "status": "publishing",
    "published_at": "2025-10-01T10:06:00Z"
  },
  "publications": [
    {
      "id": "770fa622-g4bd-63f6-c938-668877662222",
      "post_id": "660f9511-f3ac-52e5-b827-557766551111",
      "social_media_account_id": "abc-facebook-id",
      "platform_post_id": null,
      "publish_status": "publishing",
      "published_at": null,
      "retry_count": 0
    },
    {
      "id": "880fb733-h5ce-74g7-d049-779988773333",
      "post_id": "660f9511-f3ac-52e5-b827-557766551111",
      "social_media_account_id": "def-instagram-id",
      "platform_post_id": null,
      "publish_status": "publishing",
      "published_at": null,
      "retry_count": 0
    }
  ]
}
```

---

## Development Workflow

### Running Tests

**Unit Tests** (Jest + React Testing Library):

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**E2E Tests** (Playwright):

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests headless
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/onboarding.spec.ts
```

### Linting & Formatting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format with Prettier
npm run format

# Check formatting
npm run format:check
```

### Database Management

```bash
# Create new migration
supabase migration new migration_name

# Apply pending migrations
supabase db reset

# View migration status
supabase migration list

# Generate database types
npm run db:types

# Seed database
npm run db:seed
```

### Building for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start

# Verify build output
ls -lh .next/static
```

---

## Debugging Tips

### 1. Supabase Connection Issues

**Problem**: "Invalid API key" or connection timeout

**Solution**:

- Verify `.env.local` has correct Supabase URL and keys
- Check Supabase is running: `supabase status`
- Restart Supabase: `supabase stop && supabase start`

### 2. Gemini API Errors

**Problem**: "API key not valid" or quota exceeded

**Solution**:

- Enable Vertex AI API in Google Cloud Console
- Verify `GEMINI_API_KEY` in `.env.local`
- Check quota limits: [console.cloud.google.com/quotas](https://console.cloud.google.com/quotas)

### 3. OAuth Redirect Issues

**Problem**: "Invalid redirect URI" after OAuth callback

**Solution**:

- Add `http://localhost:3000/api/v1/social-accounts/{platformName}/callback` to app settings:
  - Facebook: App Dashboard > Settings > Basic > Valid OAuth Redirect URIs
  - Twitter: Developer Portal > App Settings > Authentication settings > Callback URLs
  - LinkedIn: App Settings > Auth > Redirect URLs

### 4. Database Migration Failures

**Problem**: Migration fails with "relation already exists"

**Solution**:

- Reset local database: `supabase db reset`
- Or manually drop conflicting tables:
  ```bash
  psql postgresql://postgres:postgres@localhost:54322/postgres
  DROP TABLE IF EXISTS table_name CASCADE;
  ```

### 5. TypeScript Type Errors

**Problem**: "Property does not exist on type 'Database'"

**Solution**:

- Regenerate Supabase types: `npm run db:types`
- Restart TypeScript server in VS Code: `Cmd+Shift+P` > "TypeScript: Restart TS Server"

---

## Troubleshooting Common Scenarios

### Scenario 1: User Cannot Register

**Symptoms**: "Email already registered" error despite using new email

**Diagnosis**:

1. Check if user exists in Supabase Auth dashboard
2. Verify email uniqueness constraint:
   ```sql
   SELECT email, account_status FROM users WHERE email = 'test@example.com';
   ```

**Fix**:

- Delete test user:
  ```sql
  DELETE FROM users WHERE email = 'test@example.com';
  ```
- Or use different email for testing

### Scenario 2: Post Generation Fails

**Symptoms**: "Failed to generate post" with 500 error

**Diagnosis**:

1. Check Gemini API logs: `cat logs/gemini-api.log`
2. Verify API key is valid: `echo $GEMINI_API_KEY`
3. Check subscription tier limits:
   ```sql
   SELECT posts_used_current_cycle, posts_limit
   FROM subscriptions
   WHERE user_id = '<user_id>';
   ```

**Fix**:

- Reset monthly usage (for testing):
  ```sql
  UPDATE subscriptions
  SET posts_used_current_cycle = 0
  WHERE user_id = '<user_id>';
  ```
- Or upgrade subscription tier

### Scenario 3: OAuth Connection Fails

**Symptoms**: Redirect loop or "Token exchange failed"

**Diagnosis**:

1. Check OAuth app credentials in `.env.local`
2. Verify redirect URI matches app settings
3. Check token expiry:
   ```sql
   SELECT platform, connection_status, token_expires_at
   FROM social_media_accounts
   WHERE business_profile_id = '<profile_id>';
   ```

**Fix**:

- Reconnect social account (triggers new OAuth flow)
- Or manually refresh token:
  ```sql
  UPDATE social_media_accounts
  SET connection_status = 'expired'
  WHERE id = '<account_id>';
  ```

---

## VS Code Extensions (Recommended)

Install these extensions for optimal development experience:

1. **ESLint** (`dbaeumer.vscode-eslint`) - Linting
2. **Prettier** (`esbenp.prettier-vscode`) - Code formatting
3. **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) - Tailwind autocomplete
4. **Prisma** (`Prisma.prisma`) - Database schema syntax highlighting (if using Prisma later)
5. **REST Client** (`humao.rest-client`) - Test API endpoints in VS Code
6. **Playwright Test for VS Code** (`ms-playwright.playwright`) - Run E2E tests from editor
7. **GitHub Copilot** (`GitHub.copilot`) - AI code completion

---

## Next Steps

After completing the quickstart:

1. **Explore the codebase**: Review `app/`, `components/`, `lib/` directories
2. **Run full test suite**: `npm run test:all` (unit + integration + E2E)
3. **Review API contracts**: Open `contracts/openapi.yaml` in Swagger Editor
4. **Read implementation plan**: See `plan.md` for full architecture details
5. **Review data model**: See `data-model.md` for database schema
6. **Start task execution**: Run `/tasks` command to generate implementation tasks

---

## Additional Resources

- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Google Gemini API**: [ai.google.dev/docs](https://ai.google.dev/docs)
- **Paystack API Reference**: [paystack.com/docs/api](https://paystack.com/docs/api/)
- **Playwright Testing**: [playwright.dev](https://playwright.dev/)
- **Tailwind CSS**: [tailwindcss.com/docs](https://tailwindcss.com/docs)
- **OpenAPI Specification**: [swagger.io/specification](https://swagger.io/specification/)

---

## Support

For questions or issues during development:

1. Check troubleshooting section above
2. Review error logs: `logs/app.log`, `logs/gemini-api.log`
3. Consult `spec.md` for feature requirements
4. Ask in team Slack channel: `#purple-glow-dev`

---

**Status**: ✅ Quickstart guide complete  
**Next Phase**: Execute `/tasks` command to generate implementation tasks from contracts and data model
