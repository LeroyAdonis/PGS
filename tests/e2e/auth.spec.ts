import { test, expect } from '@playwright/test'

/**
 * E2E tests for authentication flows
 * Tests: Registration, Login, Logout
 */

test.describe('Authentication', () => {
  test.describe('Registration', () => {
    test('should successfully register a new user', async ({ page }) => {
      await page.goto('/auth/register')

      // Fill in registration form
      await page.fill('input[name="email"]', `test${Date.now()}@example.com`)
      await page.fill('input[name="password"]', 'SecurePass123!')
      await page.fill('input[name="display_name"]', 'Test User')

      // Submit form
      await page.click('button[type="submit"]')

      // Should redirect to onboarding
      await expect(page).toHaveURL('/onboarding', { timeout: 10000 })
    })

    test('should show validation error for weak password', async ({ page }) => {
      await page.goto('/auth/register')

      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', '123')
      await page.fill('input[name="display_name"]', 'Test User')

      await page.click('button[type="submit"]')

      // Should show password validation error
      await expect(page.locator('text=/password.*at least 8 characters/i')).toBeVisible({
        timeout: 5000,
      })
    })

    test('should show error for duplicate email', async ({ page }) => {
      const email = 'testuser@example.com' // From seed data

      await page.goto('/auth/register')

      await page.fill('input[name="email"]', email)
      await page.fill('input[name="password"]', 'SecurePass123!')
      await page.fill('input[name="display_name"]', 'Test User')

      await page.click('button[type="submit"]')

      // Should show error message
      await expect(page.locator('text=/already.*exist/i')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Login', () => {
    test('should successfully login with valid credentials', async ({ page }) => {
      await page.goto('/auth/login')

      // Use seeded test user
      await page.fill('input[name="email"]', 'testuser@example.com')
      await page.fill('input[name="password"]', 'Test1234!')

      await page.click('button[type="submit"]')

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/login')

      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'wrongpassword')

      await page.click('button[type="submit"]')

      // Should show error message
      await expect(page.locator('text=/invalid.*credentials/i')).toBeVisible({ timeout: 5000 })
    })

    test('should show validation error for empty fields', async ({ page }) => {
      await page.goto('/auth/login')

      await page.click('button[type="submit"]')

      // Should show validation errors
      await expect(page.locator('text=/email.*required/i')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Logout', () => {
    test('should successfully logout', async ({ page }) => {
      // Login first
      await page.goto('/auth/login')
      await page.fill('input[name="email"]', 'testuser@example.com')
      await page.fill('input[name="password"]', 'Test1234!')
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

      // Logout
      await page.click('button[aria-label="User menu"]')
      await page.click('text=Logout')

      // Should redirect to login page
      await expect(page).toHaveURL('/auth/login', { timeout: 10000 })

      // Verify cannot access protected route
      await page.goto('/dashboard')
      await expect(page).toHaveURL('/auth/login', { timeout: 10000 })
    })
  })

  test.describe('Session Persistence', () => {
    test('should maintain session across page reloads', async ({ page, context }) => {
      // Login
      await page.goto('/auth/login')
      await page.fill('input[name="email"]', 'testuser@example.com')
      await page.fill('input[name="password"]', 'Test1234!')
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

      // Verify session cookie exists
      const cookies = await context.cookies()
      const sessionCookie = cookies.find(
        (c) => c.name.includes('auth') || c.name.includes('session')
      )
      expect(sessionCookie).toBeDefined()

      // Reload page
      await page.reload()

      // Should still be on dashboard
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    })
  })
})
