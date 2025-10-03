import { test, expect } from '@playwright/test'

/**
 * E2E tests for post publishing flow
 * Tests: Schedule post, immediate publish, view published posts
 */

test.describe('Post Publishing', () => {
  test.beforeEach(async ({ page }) => {
    // Login with seeded test user
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'testuser@example.com')
    await page.fill('input[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
  })

  test('should schedule a post for future publishing', async ({ page }) => {
    // Navigate to posts
    await page.goto('/posts')

    // Find an approved post
    const approvedPost = page.locator('[data-status="approved"]').first()

    if (await approvedPost.isVisible({ timeout: 2000 })) {
      // Click schedule button
      await approvedPost.locator('button:has-text("Schedule")').click()

      // Set schedule time (10 minutes from now)
      const futureDate = new Date(Date.now() + 10 * 60 * 1000)
      const dateString = futureDate.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:mm

      // Fill datetime input
      await page.fill('input[type="datetime-local"]', dateString)

      // Confirm schedule
      await page.click('button:has-text("Confirm"), button:has-text("Schedule")')

      // Should show success message
      await expect(page.locator('text=/scheduled|success/i')).toBeVisible({ timeout: 5000 })

      // Post status should change to scheduled
      await expect(approvedPost).toHaveAttribute('data-status', 'scheduled', { timeout: 5000 })
    }
  })

  test('should publish a post immediately', async ({ page }) => {
    // Navigate to posts
    await page.goto('/posts')

    // Find an approved post
    const approvedPost = page.locator('[data-status="approved"]').first()

    if (await approvedPost.isVisible({ timeout: 2000 })) {
      // Click publish now button
      await approvedPost.locator('button:has-text("Publish Now"), button:has-text("Publish")').click()

      // Confirm immediate publish
      await page.click('button:has-text("Confirm"), button:has-text("Yes")')

      // Should show publishing status
      await expect(page.locator('text=/publishing|queued/i')).toBeVisible({ timeout: 5000 })

      // Wait for publish to complete (mocked in test environment)
      await page.waitForTimeout(2000)

      // Post status should change to published or publishing
      await expect(approvedPost).toHaveAttribute('data-status', /published|publishing/, {
        timeout: 10000,
      })
    }
  })

  test('should show validation error for past schedule time', async ({ page }) => {
    await page.goto('/posts')

    const approvedPost = page.locator('[data-status="approved"]').first()

    if (await approvedPost.isVisible({ timeout: 2000 })) {
      // Click schedule button
      await approvedPost.locator('button:has-text("Schedule")').click()

      // Try to set schedule time in the past
      const pastDate = new Date(Date.now() - 10 * 60 * 1000)
      const dateString = pastDate.toISOString().slice(0, 16)

      await page.fill('input[type="datetime-local"]', dateString)
      await page.click('button:has-text("Confirm"), button:has-text("Schedule")')

      // Should show validation error
      await expect(page.locator('text=/future|past|invalid/i')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should view scheduled posts in calendar view', async ({ page }) => {
    // Navigate to calendar
    await page.goto('/calendar')

    // Should see calendar component
    await expect(page.locator('[data-testid="content-calendar"], .calendar')).toBeVisible({
      timeout: 5000,
    })

    // Should display scheduled posts
    await expect(
      page.locator('[data-status="scheduled"], .scheduled-post').first()
    ).toBeVisible({ timeout: 5000 })
  })

  test('should cancel a scheduled post', async ({ page }) => {
    await page.goto('/posts')

    // Find a scheduled post
    const scheduledPost = page.locator('[data-status="scheduled"]').first()

    if (await scheduledPost.isVisible({ timeout: 2000 })) {
      // Click cancel schedule button
      await scheduledPost.locator('button:has-text("Cancel"), button:has-text("Unschedule")').click()

      // Confirm cancellation
      await page.click('button:has-text("Confirm"), button:has-text("Yes")')

      // Should show success message
      await expect(page.locator('text=/cancelled|unscheduled/i')).toBeVisible({ timeout: 5000 })

      // Post status should revert to approved
      await expect(scheduledPost).toHaveAttribute('data-status', 'approved', { timeout: 5000 })
    }
  })

  test('should display publish status for each platform', async ({ page }) => {
    await page.goto('/posts')

    // Find a publishing or published post
    const publishedPost = page.locator('[data-status="published"], [data-status="publishing"]').first()

    if (await publishedPost.isVisible({ timeout: 2000 })) {
      // Click to view details
      await publishedPost.click()

      // Should show platform-specific publish status
      await expect(
        page.locator('text=/facebook|instagram|twitter|linkedin/i').first()
      ).toBeVisible({ timeout: 5000 })

      // Should show publish status indicators
      await expect(
        page.locator('text=/published|failed|pending/i').first()
      ).toBeVisible({ timeout: 5000 })
    }
  })

  test('should retry failed publication', async ({ page }) => {
    await page.goto('/posts')

    // Find a post with failed publication
    const failedPost = page.locator('[data-publish-status="failed"]').first()

    if (await failedPost.isVisible({ timeout: 2000 })) {
      // Click retry button
      await failedPost.locator('button:has-text("Retry")').click()

      // Should show retrying status
      await expect(page.locator('text=/retrying|publishing/i')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should show published posts count on dashboard', async ({ page }) => {
    await page.goto('/dashboard')

    // Should display posts count widget
    await expect(page.locator('text=/posts.*published|published.*posts/i')).toBeVisible({
      timeout: 5000,
    })

    // Should show numeric count
    await expect(page.locator('text=/\\d+.*post/i')).toBeVisible({ timeout: 5000 })
  })

  test('should require social account connection before publishing', async ({ page, context }) => {
    // Create a new user without social accounts
    const newEmail = `noaccount${Date.now()}@example.com`
    
    // Register
    await page.goto('/auth/register')
    await page.fill('input[name="email"]', newEmail)
    await page.fill('input[name="password"]', 'SecurePass123!')
    await page.fill('input[name="display_name"]', 'No Account User')
    await page.click('button[type="submit"]')

    // Complete onboarding without connecting social accounts
    await expect(page).toHaveURL('/onboarding', { timeout: 10000 })
    
    // Fill business profile
    await page.fill('input[name="business_name"]', 'Test Business')
    await page.selectOption('select[name="industry"]', { label: 'Technology' })
    await page.fill('textarea[name="target_audience"]', 'Everyone')
    await page.fill('input[name="primary_color"]', '#6B46C1')
    await page.selectOption('select[name="content_tone"]', { label: 'Professional' })
    await page.fill('input[name="content_topics"]', 'tech')
    await page.selectOption('select[name="preferred_language"]', { label: 'English' })
    await page.click('button:has-text("Next")')
    
    // Skip social connection
    await page.click('button:has-text("Skip")')
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    // Navigate to posts (or try to generate/publish)
    await page.goto('/posts')

    // Should show prompt to connect social accounts
    await expect(
      page.locator('text=/connect.*social|no.*account.*connected/i')
    ).toBeVisible({ timeout: 5000 })
  })

  test('should show upcoming scheduled posts on dashboard', async ({ page }) => {
    await page.goto('/dashboard')

    // Should display upcoming posts widget
    await expect(
      page.locator('text=/upcoming|scheduled.*posts/i').first()
    ).toBeVisible({ timeout: 5000 })
  })
})
