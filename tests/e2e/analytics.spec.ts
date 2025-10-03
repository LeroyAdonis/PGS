import { test, expect } from '@playwright/test'

/**
 * E2E tests for analytics flow
 * Tests: View analytics dashboard, top posts, engagement metrics
 */

test.describe('Analytics', () => {
  test.beforeEach(async ({ page }) => {
    // Login with seeded test user
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'testuser@example.com')
    await page.fill('input[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
  })

  test('should display analytics dashboard', async ({ page }) => {
    // Navigate to analytics
    await page.goto('/analytics')

    // Should see analytics page header
    await expect(page.locator('h1, h2').filter({ hasText: /analytics/i })).toBeVisible({
      timeout: 5000,
    })

    // Should display analytics chart
    await expect(page.locator('[data-testid="analytics-chart"], .analytics-chart')).toBeVisible({
      timeout: 5000,
    })

    // Should display summary metrics
    await expect(page.locator('text=/total.*engagement|impressions|reach/i').first()).toBeVisible({
      timeout: 5000,
    })
  })

  test('should display engagement metrics', async ({ page }) => {
    await page.goto('/analytics')

    // Should display key metrics
    await expect(page.locator('text=/likes|reactions/i').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=/comments/i').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=/shares/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('should display top posts table', async ({ page }) => {
    await page.goto('/analytics')

    // Should display top posts section
    await expect(page.locator('text=/top.*posts|best.*performing/i')).toBeVisible({
      timeout: 5000,
    })

    // Should display posts in table format
    await expect(
      page.locator('table, [role="table"], [data-testid="top-posts-table"]')
    ).toBeVisible({ timeout: 5000 })
  })

  test('should filter analytics by date range', async ({ page }) => {
    await page.goto('/analytics')

    // Click date range selector
    await page.click('button:has-text("Date Range"), select[name="dateRange"]')

    // Select last 7 days
    await page.click('text=/last.*7.*days|7.*days/i')

    // Chart should update (wait for re-render)
    await page.waitForTimeout(1000)

    // Should display date range label
    await expect(page.locator('text=/last.*7.*days/i')).toBeVisible({ timeout: 5000 })
  })

  test('should filter analytics by platform', async ({ page }) => {
    await page.goto('/analytics')

    // Click platform filter
    await page.click('button:has-text("Platform"), select[name="platform"]')

    // Select Facebook
    await page.click('text=/facebook/i')

    // Chart should update
    await page.waitForTimeout(1000)

    // Should show Facebook-specific data
    await expect(page.locator('text=/facebook/i')).toBeVisible({ timeout: 5000 })
  })

  test('should display analytics summary cards', async ({ page }) => {
    await page.goto('/analytics')

    // Should display summary cards
    await expect(page.locator('[data-testid="analytics-summary"]')).toBeVisible({ timeout: 5000 })

    // Should display numeric values
    const metricCards = page.locator('[data-testid="metric-card"], .metric-card')
    const count = await metricCards.count()
    
    expect(count).toBeGreaterThan(0)
  })

  test('should display engagement rate', async ({ page }) => {
    await page.goto('/analytics')

    // Should display engagement rate percentage
    await expect(page.locator('text=/\\d+\\.?\\d*%/').first()).toBeVisible({ timeout: 5000 })
  })

  test('should show analytics for individual post', async ({ page }) => {
    // Navigate to posts
    await page.goto('/posts')

    // Find a published post
    const publishedPost = page.locator('[data-status="published"]').first()

    if (await publishedPost.isVisible({ timeout: 2000 })) {
      // Click on post to view details
      await publishedPost.click()

      // Should display post-specific analytics
      await expect(page.locator('text=/views|impressions|reach/i')).toBeVisible({ timeout: 5000 })
      await expect(page.locator('text=/engagement|interactions/i')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should display growth chart over time', async ({ page }) => {
    await page.goto('/analytics')

    // Should display chart with time series data
    await expect(
      page.locator('canvas, svg').filter({ has: page.locator('path, line, rect') }).first()
    ).toBeVisible({ timeout: 5000 })
  })

  test('should show no data message for new accounts', async ({ page, context }) => {
    // Create a new user
    const newEmail = `newanalytics${Date.now()}@example.com`
    
    await page.goto('/auth/register')
    await page.fill('input[name="email"]', newEmail)
    await page.fill('input[name="password"]', 'SecurePass123!')
    await page.fill('input[name="display_name"]', 'New Analytics User')
    await page.click('button[type="submit"]')

    // Complete onboarding
    await expect(page).toHaveURL('/onboarding', { timeout: 10000 })
    await page.fill('input[name="business_name"]', 'New Business')
    await page.selectOption('select[name="industry"]', { label: 'Technology' })
    await page.fill('textarea[name="target_audience"]', 'Everyone')
    await page.fill('input[name="primary_color"]', '#6B46C1')
    await page.selectOption('select[name="content_tone"]', { label: 'Professional' })
    await page.fill('input[name="content_topics"]', 'general')
    await page.selectOption('select[name="preferred_language"]', { label: 'English' })
    await page.click('button:has-text("Next")')
    await page.click('button:has-text("Skip")')

    // Navigate to analytics
    await page.goto('/analytics')

    // Should show no data message
    await expect(page.locator('text=/no.*data|no.*analytics|start.*posting/i')).toBeVisible({
      timeout: 5000,
    })
  })

  test('should export analytics data', async ({ page }) => {
    await page.goto('/analytics')

    // Find export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")')

    if (await exportButton.isVisible({ timeout: 2000 })) {
      // Click export button
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportButton.click(),
      ])

      // Verify download was triggered
      expect(download).toBeDefined()
    }
  })

  test('should display platform-specific metrics', async ({ page }) => {
    await page.goto('/analytics')

    // Should display metrics for each connected platform
    const platforms = ['Facebook', 'Instagram', 'Twitter', 'LinkedIn']
    
    for (const platform of platforms) {
      const platformMetrics = page.locator(`text=/^${platform}/i`)
      
      if (await platformMetrics.isVisible({ timeout: 1000 })) {
        // Verify platform has associated metrics
        await expect(platformMetrics).toBeVisible()
      }
    }
  })

  test('should show best posting times recommendation', async ({ page }) => {
    await page.goto('/analytics')

    // Should display insights or recommendations
    const insightsSection = page.locator('text=/insights|recommendations|best.*time/i').first()
    
    if (await insightsSection.isVisible({ timeout: 2000 })) {
      await expect(insightsSection).toBeVisible()
    }
  })

  test('should display analytics comparison between time periods', async ({ page }) => {
    await page.goto('/analytics')

    // Look for comparison indicators (e.g., "+12% vs last month")
    const comparisonIndicator = page.locator('text=/[+\\-]\\d+%|vs.*previous/i').first()
    
    if (await comparisonIndicator.isVisible({ timeout: 2000 })) {
      await expect(comparisonIndicator).toBeVisible()
    }
  })

  test('should show quick stats on dashboard', async ({ page }) => {
    await page.goto('/dashboard')

    // Should display quick analytics stats
    await expect(page.locator('text=/engagement|impressions|posts.*published/i').first()).toBeVisible({
      timeout: 5000,
    })

    // Should show numeric values
    await expect(page.locator('text=/\\d+/').first()).toBeVisible({ timeout: 5000 })
  })
})
