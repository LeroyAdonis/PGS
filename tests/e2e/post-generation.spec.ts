import { test, expect } from '@playwright/test'

/**
 * E2E tests for post generation flow
 * Tests: Generate post, approve, edit, delete
 */

test.describe('Post Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Login with seeded test user who has a business profile
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'testuser@example.com')
    await page.fill('input[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
  })

  test('should generate a new post with AI', async ({ page }) => {
    // Navigate to posts page or find generate button
    await page.click('a[href="/posts"], button:has-text("Generate Post"), button:has-text("Create Post")')

    // Fill in post generation form
    await page.fill('input[name="topic"], textarea[name="topic"]', 'New product launch announcement')
    
    // Select platforms
    const facebookCheckbox = page.locator('input[type="checkbox"][value="facebook"], input[name="platform_facebook"]')
    if (await facebookCheckbox.isVisible()) {
      await facebookCheckbox.check()
    }

    // Click generate button
    await page.click('button:has-text("Generate"), button[type="submit"]')

    // Wait for AI generation (may take a few seconds)
    await expect(page.locator('text=/generating|loading/i')).toBeVisible({ timeout: 5000 })
    
    // Wait for generation to complete
    await expect(page.locator('text=/generating|loading/i')).not.toBeVisible({ timeout: 30000 })

    // Verify post was generated - should see caption and image
    await expect(
      page.locator('textarea[name="caption"], div[role="textbox"]').first()
    ).toBeVisible({ timeout: 5000 })
    
    // Verify image was generated
    await expect(page.locator('img[alt*="post"], img[alt*="generated"]').first()).toBeVisible({
      timeout: 5000,
    })
  })

  test('should approve a generated post', async ({ page }) => {
    // Navigate to posts page
    await page.goto('/posts')

    // Find a pending post (from seed data or generate new one)
    const pendingPost = page.locator('[data-status="pending"]').first()
    
    if (await pendingPost.isVisible({ timeout: 2000 })) {
      // Click approve button
      await pendingPost.locator('button:has-text("Approve")').click()

      // Should show success message
      await expect(page.locator('text=/approved|success/i')).toBeVisible({ timeout: 5000 })

      // Post status should change to approved
      await expect(pendingPost).toHaveAttribute('data-status', 'approved', { timeout: 5000 })
    }
  })

  test('should edit a generated post caption', async ({ page }) => {
    // Navigate to posts page
    await page.goto('/posts')

    // Find a post and click edit
    const firstPost = page.locator('[data-testid="post-card"]').first()
    await firstPost.locator('button:has-text("Edit"), [aria-label="Edit"]').click()

    // Edit the caption
    const captionField = page.locator('textarea[name="caption"]')
    await captionField.clear()
    await captionField.fill('Updated caption for my post #UpdatedHashtag')

    // Save changes
    await page.click('button:has-text("Save")')

    // Should show success message
    await expect(page.locator('text=/saved|updated|success/i')).toBeVisible({ timeout: 5000 })

    // Verify caption was updated
    await expect(page.locator('text=Updated caption for my post')).toBeVisible({ timeout: 5000 })
  })

  test('should delete a post', async ({ page }) => {
    // Navigate to posts page
    await page.goto('/posts')

    // Get initial post count
    const initialPosts = await page.locator('[data-testid="post-card"]').count()

    // Find a post and click delete
    const firstPost = page.locator('[data-testid="post-card"]').first()
    await firstPost.locator('button:has-text("Delete"), [aria-label="Delete"]').click()

    // Confirm deletion
    await page.click('button:has-text("Confirm"), button:has-text("Yes")')

    // Should show success message
    await expect(page.locator('text=/deleted|removed/i')).toBeVisible({ timeout: 5000 })

    // Post count should decrease
    await expect(page.locator('[data-testid="post-card"]')).toHaveCount(initialPosts - 1, {
      timeout: 5000,
    })
  })

  test('should show validation error for empty topic', async ({ page }) => {
    // Try to generate post without topic
    await page.click('button:has-text("Generate Post"), button:has-text("Create Post")')

    // Try to submit without topic
    await page.click('button:has-text("Generate"), button[type="submit"]')

    // Should show validation error
    await expect(page.locator('text=/topic.*required/i')).toBeVisible({ timeout: 5000 })
  })

  test('should regenerate image for a post', async ({ page }) => {
    // Navigate to posts page
    await page.goto('/posts')

    // Find a post with an image
    const postWithImage = page.locator('[data-testid="post-card"]').first()
    
    // Click edit
    await postWithImage.locator('button:has-text("Edit")').click()

    // Click regenerate image button
    await page.click('button:has-text("Regenerate Image")')

    // Should show loading indicator
    await expect(page.locator('text=/generating|loading/i')).toBeVisible({ timeout: 5000 })

    // Wait for regeneration to complete
    await expect(page.locator('text=/generating|loading/i')).not.toBeVisible({ timeout: 30000 })

    // Should show new image
    await expect(page.locator('img[alt*="post"], img[alt*="generated"]')).toBeVisible({
      timeout: 5000,
    })
  })

  test('should filter posts by status', async ({ page }) => {
    await page.goto('/posts')

    // Click on approved filter
    await page.click('button:has-text("Approved"), [role="tab"]:has-text("Approved")')

    // All visible posts should have approved status
    const posts = page.locator('[data-testid="post-card"]')
    const count = await posts.count()
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(posts.nth(i)).toHaveAttribute('data-status', 'approved')
      }
    }
  })

  test('should display post hashtags', async ({ page }) => {
    await page.goto('/posts')

    // Find a post
    const firstPost = page.locator('[data-testid="post-card"]').first()

    // Should display hashtags
    await expect(firstPost.locator('text=/^#\\w+/')).toBeVisible({ timeout: 5000 })
  })

  test('should show post preview before approval', async ({ page }) => {
    // Generate a new post or navigate to a pending post
    await page.goto('/posts')

    const pendingPost = page.locator('[data-status="pending"]').first()
    
    if (await pendingPost.isVisible({ timeout: 2000 })) {
      // Click preview button
      await pendingPost.locator('button:has-text("Preview")').click()

      // Should show preview modal/dialog
      await expect(page.locator('[role="dialog"], .modal').first()).toBeVisible({ timeout: 5000 })

      // Should display caption and image in preview
      await expect(
        page.locator('[role="dialog"], .modal').first().locator('img')
      ).toBeVisible()
    }
  })
})
