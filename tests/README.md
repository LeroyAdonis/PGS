# Purple Glow Social - Test Suite

This directory contains all tests for the Purple Glow Social application.

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests (Playwright)
│   ├── auth.spec.ts        # Authentication flows
│   ├── onboarding.spec.ts  # Onboarding wizard
│   ├── post-generation.spec.ts  # Post creation and management
│   ├── publishing.spec.ts  # Post scheduling and publishing
│   └── analytics.spec.ts   # Analytics dashboard
├── performance/            # Performance tests (Playwright)
│   ├── ai-generation.test.ts      # AI generation latency (<2s p95)
│   └── dashboard-load.test.ts     # Dashboard load time (<500ms p95)
├── integration/            # API integration tests (Jest)
│   ├── auth.test.ts
│   ├── posts.test.ts
│   └── ...
├── unit/                   # Unit tests (Jest)
│   ├── gemini/
│   ├── lib/
│   └── ...
└── setup.ts               # Jest test setup
```

## Running Tests

### Unit & Integration Tests (Jest)

```bash
# Run all Jest tests
npm test

# Run in watch mode (for development)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test -- tests/unit/gemini/text-generation.test.ts
```

### E2E Tests (Playwright)

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests (excludes performance tests)
npm run test:e2e

# Run E2E tests with UI mode (interactive)
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run tests for specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Performance Tests (Playwright)

**Note:** Performance tests take a long time to run (100+ requests each) and are excluded from `npm run test:e2e` by default.

```bash
# Run performance tests only
npm run test:performance

# Or set environment variable
RUN_PERFORMANCE_TESTS=true npm run test:e2e
```

### Run All Tests

```bash
# Run all tests (unit, integration, e2e) + linting + type checking
npm run test:all
```

## E2E Test Coverage

### Authentication (auth.spec.ts)
- ✅ User registration
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Logout
- ✅ Session persistence
- ✅ Password validation
- ✅ Duplicate email detection

### Onboarding (onboarding.spec.ts)
- ✅ Complete onboarding flow
- ✅ Business profile creation
- ✅ Business profile data persistence
- ✅ Form validation
- ✅ Social media connection (optional)
- ✅ Navigation between steps
- ✅ Redirect to onboarding for users without profile

### Post Generation (post-generation.spec.ts)
- ✅ Generate AI post with caption and image
- ✅ Approve generated post
- ✅ Edit post caption
- ✅ Delete post
- ✅ Regenerate image
- ✅ Filter posts by status
- ✅ Display hashtags
- ✅ Post preview
- ✅ Topic validation

### Publishing (publishing.spec.ts)
- ✅ Schedule post for future publishing
- ✅ Publish post immediately
- ✅ Cancel scheduled post
- ✅ View scheduled posts in calendar
- ✅ Display publish status per platform
- ✅ Retry failed publication
- ✅ Schedule time validation
- ✅ Social account requirement check
- ✅ Dashboard widgets (published posts, upcoming posts)

### Analytics (analytics.spec.ts)
- ✅ Display analytics dashboard
- ✅ Display engagement metrics (likes, comments, shares)
- ✅ Display top posts table
- ✅ Filter by date range
- ✅ Filter by platform
- ✅ Analytics summary cards
- ✅ Engagement rate calculation
- ✅ Individual post analytics
- ✅ Growth chart over time
- ✅ No data message for new accounts
- ✅ Export analytics data
- ✅ Platform-specific metrics
- ✅ Best posting times recommendation
- ✅ Time period comparison
- ✅ Quick stats on dashboard

## Performance Test Coverage

### AI Generation (ai-generation.test.ts)
- ✅ Measure p95 latency for 100 AI generation requests
- ✅ Target: <2s p95 latency
- ✅ Separate text generation latency measurement
- ✅ Separate image generation latency measurement

### Dashboard Load (dashboard-load.test.ts)
- ✅ Measure p95 load time for 100 dashboard loads
- ✅ Target: <500ms p95 load time
- ✅ API response time measurement
- ✅ Time to First Contentful Paint
- ✅ Cached asset load time
- ✅ Posts list page load time

## Test Environment Setup

### Prerequisites
- Node.js >= 20.0.0
- Supabase CLI (for local testing)
- Environment variables configured in `.env.local`

### Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini API
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Paystack
PAYSTACK_SECRET_KEY=your-paystack-key
```

### Local Supabase Setup
```bash
# Start local Supabase instance
supabase start

# Apply migrations
supabase db reset

# Seed test data
npm run db:seed
```

## Debugging Tests

### Playwright Debug Mode
```bash
# Run tests with Playwright Inspector
PWDEBUG=1 npx playwright test tests/e2e/auth.spec.ts

# Run tests with headed browser
npx playwright test --headed --project=chromium

# Generate trace for failed tests
npx playwright test --trace on
```

### Jest Debug Mode
```bash
# Run Jest in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Or use VS Code debugger with "Jest: Debug" configuration
```

## CI/CD Integration

Tests are automatically run on every pull request via GitHub Actions:

- **Lint & Type Check**: ESLint + TypeScript
- **Unit & Integration Tests**: Jest with coverage
- **E2E Tests**: Playwright (chromium only in CI)
- **Build**: Next.js production build
- **Security Audit**: npm audit

Performance tests run weekly on Sunday at 2am UTC.

## Test Data

Test users are created by the seed script:

```
Test User:
  Email: testuser@example.com
  Password: Test1234!
  
Admin User:
  Email: admin@purpleglowsocial.com
  Password: Admin1234!
```

## Troubleshooting

### E2E Tests Fail Locally
- Ensure Supabase is running: `supabase status`
- Ensure dev server is running: `npm run dev`
- Clear Playwright cache: `npx playwright install --force`

### Performance Tests Timeout
- Performance tests are resource-intensive and may timeout on slow machines
- Reduce SAMPLE_SIZE constant in test files for local testing
- Ensure no other applications are consuming resources

### Jest Tests Fail
- Check Node.js version: `node -v` (should be >= 20.0.0)
- Clear Jest cache: `npm test -- --clearCache`
- Regenerate Supabase types: `npm run db:types`

## Contributing

When adding new features:
1. Write unit tests for business logic
2. Write integration tests for API routes
3. Write E2E tests for user-facing features
4. Ensure all tests pass before submitting PR
5. Aim for 80%+ code coverage

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)
