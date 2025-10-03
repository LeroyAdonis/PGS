import { test, expect } from '@playwright/test'

/**
 * E2E tests for onboarding flow
 * Tests: Business profile creation, social media connection
 */

test.describe('Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    // Register a new user for each test
    const email = `onboarding${Date.now()}@example.com`
    await page.goto('/auth/register')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', 'SecurePass123!')
    await page.fill('input[name="display_name"]', 'Onboarding Test User')
    await page.click('button[type="submit"]')
    
    // Should be redirected to onboarding
    await expect(page).toHaveURL('/onboarding', { timeout: 10000 })
  })

  test('should complete full onboarding process', async ({ page }) => {
    // Step 1: Business Profile Creation
    await expect(page.locator('h1, h2').filter({ hasText: /business profile/i })).toBeVisible()

    // Fill business profile form
    await page.fill('input[name="business_name"]', 'Test Business Corp')
    await page.selectOption('select[name="industry"]', { label: 'Technology' })
    await page.fill(
      'textarea[name="target_audience"]',
      'Small businesses looking for software solutions'
    )
    await page.fill('input[name="primary_color"]', '#6B46C1')
    await page.selectOption('select[name="content_tone"]', { label: 'Professional' })
    await page.fill('input[name="content_topics"]', 'software, productivity, automation')
    await page.selectOption('select[name="preferred_language"]', { label: 'English' })

    // Click next to go to social connection step
    await page.click('button:has-text("Next"), button:has-text("Continue")')

    // Step 2: Social Media Connection (optional step)
    await expect(
      page.locator('h1, h2').filter({ hasText: /connect.*social|social.*account/i })
    ).toBeVisible({ timeout: 5000 })

    // Skip social connection
    await page.click('button:has-text("Skip"), button:has-text("Later")')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    // Verify dashboard shows welcome message
    await expect(page.locator('text=/welcome/i')).toBeVisible({ timeout: 5000 })
  })

  test('should save business profile data correctly', async ({ page }) => {
    // Fill and submit business profile
    await page.fill('input[name="business_name"]', 'Data Test Business')
    await page.selectOption('select[name="industry"]', { label: 'Technology' })
    await page.fill('textarea[name="target_audience"]', 'Tech-savvy professionals')
    await page.fill('input[name="primary_color"]', '#9333ea')
    await page.selectOption('select[name="content_tone"]', { label: 'Professional' })
    await page.fill('input[name="content_topics"]', 'technology, innovation')
    await page.selectOption('select[name="preferred_language"]', { label: 'English' })

    await page.click('button:has-text("Next"), button:has-text("Continue")')

    // Skip social connection
    await page.click('button:has-text("Skip"), button:has-text("Later")')
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    // Navigate to settings to verify data
    await page.click('a[href="/settings"], nav >> text=Settings')
    await expect(page).toHaveURL('/settings', { timeout: 10000 })

    // Verify business profile data is displayed
    const businessNameInput = page.locator('input[name="business_name"]')
    await expect(businessNameInput).toHaveValue('Data Test Business')
  })

  test('should show validation errors for incomplete business profile', async ({ page }) => {
    // Try to submit without filling required fields
    await page.click('button:has-text("Next"), button:has-text("Continue")')

    // Should show validation errors
    await expect(page.locator('text=/business name.*required/i')).toBeVisible({ timeout: 5000 })
  })

  test('should allow connecting social media account during onboarding', async ({ page }) => {
    // Fill business profile
    await page.fill('input[name="business_name"]', 'Social Connect Test')
    await page.selectOption('select[name="industry"]', { label: 'Technology' })
    await page.fill('textarea[name="target_audience"]', 'Tech startups')
    await page.fill('input[name="primary_color"]', '#6B46C1')
    await page.selectOption('select[name="content_tone"]', { label: 'Professional' })
    await page.fill('input[name="content_topics"]', 'tech')
    await page.selectOption('select[name="preferred_language"]', { label: 'English' })

    await page.click('button:has-text("Next"), button:has-text("Continue")')

    // Try to connect Facebook (will use mock OAuth in test environment)
    await page.click('button:has-text("Connect Facebook")')

    // In test environment, OAuth should be mocked or we should see OAuth redirect
    // For now, just verify the button was clickable
    await page.waitForTimeout(1000)
  })

  test('should allow navigation back to business profile step', async ({ page }) => {
    // Fill business profile
    await page.fill('input[name="business_name"]', 'Navigation Test')
    await page.selectOption('select[name="industry"]', { label: 'Technology' })
    await page.fill('textarea[name="target_audience"]', 'Everyone')
    await page.fill('input[name="primary_color"]', '#6B46C1')
    await page.selectOption('select[name="content_tone"]', { label: 'Professional' })
    await page.fill('input[name="content_topics"]', 'general')
    await page.selectOption('select[name="preferred_language"]', { label: 'English' })

    await page.click('button:has-text("Next"), button:has-text("Continue")')

    // On social connection step
    await expect(
      page.locator('h1, h2').filter({ hasText: /connect.*social|social.*account/i })
    ).toBeVisible({ timeout: 5000 })

    // Go back
    await page.click('button:has-text("Back"), button:has-text("Previous")')

    // Should be back on business profile step
    await expect(page.locator('h1, h2').filter({ hasText: /business profile/i })).toBeVisible()

    // Data should be preserved
    const businessNameInput = page.locator('input[name="business_name"]')
    await expect(businessNameInput).toHaveValue('Navigation Test')
  })

  test('should redirect authenticated users without profile to onboarding', async ({ page }) => {
    // Already on onboarding from beforeEach
    
    // Try to navigate to dashboard directly
    await page.goto('/dashboard')

    // Should be redirected back to onboarding
    await expect(page).toHaveURL('/onboarding', { timeout: 10000 })
  })
})
