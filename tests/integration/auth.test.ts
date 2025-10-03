/**
 * @jest-environment node
 */
/**
 * Integration tests for Authentication API routes
 * Tests: POST /auth/register, POST /auth/login, POST /auth/logout, POST /auth/refresh
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Create Supabase admin client for test setup/teardown
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

describe('Authentication API', () => {
  const testEmail = `test-${Date.now()}@purpleglowsocial.test`
  const testPassword = 'Test1234!@#$'
  const testDisplayName = 'Test User'

  // Cleanup function
  const cleanupUser = async (email: string) => {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const user = users.users.find((u) => u.email === email)
    if (user) {
      await supabaseAdmin.auth.admin.deleteUser(user.id)
    }
  }

  beforeAll(async () => {
    // Cleanup any existing test user
    await cleanupUser(testEmail)
  })

  afterAll(async () => {
    // Cleanup test user
    await cleanupUser(testEmail)
  })

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          displayName: testDisplayName,
          acceptTerms: true,
        }),
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data).toHaveProperty('user')
      expect(data).toHaveProperty('session')
      expect(data.user.email).toBe(testEmail)
      expect(data.user.display_name).toBe(testDisplayName)
      expect(data.user.role).toBe('user')
      expect(data.user.account_status).toBe('active')
      expect(data.session).toHaveProperty('access_token')
      expect(data.session).toHaveProperty('refresh_token')

      // User ID stored for potential future use in cleanup
    })

    it('should reject registration with existing email', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          displayName: testDisplayName,
          acceptTerms: true,
        }),
      })

      expect(response.status).toBe(409)

      const data = await response.json()
      expect(data.type).toContain('conflict')
      expect(data.detail).toContain('already exists')
    })

    it('should reject invalid email format', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          password: testPassword,
          displayName: testDisplayName,
          acceptTerms: true,
        }),
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.type).toContain('validation')
    })

    it('should reject weak password', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test-weak-${Date.now()}@test.com`,
          password: '123',
          displayName: testDisplayName,
          acceptTerms: true,
        }),
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.type).toContain('validation')
    })

    it('should reject without accepting terms', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test-terms-${Date.now()}@test.com`,
          password: testPassword,
          displayName: testDisplayName,
          acceptTerms: false,
        }),
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.type).toContain('validation')
    })
  })

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('user')
      expect(data).toHaveProperty('session')
      expect(data.user.email).toBe(testEmail)
      expect(data.session).toHaveProperty('access_token')
      expect(data.session).toHaveProperty('refresh_token')

      // Tokens available for other tests if needed
    })

    it('should reject invalid password', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'WrongPassword123!',
        }),
      })

      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.type).toContain('unauthorized')
      expect(data.detail).toContain('Invalid email or password')
    })

    it('should reject non-existent email', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@test.com',
          password: testPassword,
        }),
      })

      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.type).toContain('unauthorized')
    })

    it('should update last_login_at timestamp', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.user.last_login_at).toBeTruthy()
    })
  })

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string

    beforeEach(async () => {
      // Login to get a refresh token
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      })

      const data = await response.json()
      refreshToken = data.session.refresh_token
    })

    it('should refresh token successfully', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('access_token')
      expect(data).toHaveProperty('expires_at')
      expect(data.access_token).toBeTruthy()
      expect(data.expires_at).toBeGreaterThan(Date.now() / 1000)
    })

    it('should reject invalid refresh token', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: 'invalid-token',
        }),
      })

      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.type).toContain('unauthorized')
      expect(data.detail).toContain('Invalid or expired refresh token')
    })

    it('should reject missing refresh token', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.type).toContain('validation')
    })
  })

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string

    beforeEach(async () => {
      // Login to get an access token
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      })

      const data = await response.json()
      accessToken = data.session.access_token
    })

    it('should logout successfully with valid token', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(204)
      expect(response.body).toBeNull()
    })

    it('should reject logout without token', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/logout`, {
        method: 'POST',
      })

      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.type).toContain('unauthorized')
    })

    it('should reject logout with invalid token', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      })

      expect(response.status).toBe(401)
    })
  })
})
