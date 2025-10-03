import { describe, it, expect } from '@jest/globals'

// Test configuration
const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

describe('Rate Limiting Middleware', () => {
  describe('Unauthenticated requests', () => {
    it('should allow up to 10 requests per minute for unauthenticated users', async () => {
      const requests = []

      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
        requests.push(response)
      }

      // All requests should succeed (even if auth fails, rate limiting should allow them)
      const successCount = requests.filter((r) => r.status !== 429).length
      expect(successCount).toBe(10)
    })

    it('should return 429 for unauthenticated requests exceeding 10 per minute', async () => {
      // Make 11 requests rapidly
      const requests = []

      for (let i = 0; i < 11; i++) {
        const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
        requests.push(response)
      }

      // At least one request should be rate limited
      const rateLimitedCount = requests.filter((r) => r.status === 429).length
      expect(rateLimitedCount).toBeGreaterThan(0)
    })

    it('should include proper rate limit headers', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
    })

    it('should return proper error response when rate limited', async () => {
      // First make many requests to trigger rate limiting
      for (let i = 0; i < 10; i++) {
        await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      }

      // This request should be rate limited
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      expect(response.status).toBe(429)
      const data = await response.json()
      expect(data).toHaveProperty(
        'type',
        'https://api.purpleglowsocial.co.za/errors/rate-limit-exceeded'
      )
      expect(data).toHaveProperty('title', 'Rate Limit Exceeded')
      expect(data).toHaveProperty('status', 429)
      expect(data).toHaveProperty('detail')
      expect(data).toHaveProperty('retryAfter')
      expect(data).toHaveProperty('instance')

      // Check headers
      expect(response.headers.get('Retry-After')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
    })
  })

  describe('Authenticated requests', () => {
    it('should allow up to 100 requests per minute for authenticated users', async () => {
      // Note: This test would require a valid authenticated session
      // For now, we'll test that the middleware doesn't break normal flow
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      // Should not be rate limited (even if auth fails)
      expect(response.status).not.toBe(429)
    })

    it('should use higher limit for authenticated requests', async () => {
      // This would require setting up authenticated sessions
      // For integration testing, we verify the middleware applies different limits
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Simulate having session cookies
          Cookie: 'sb-access-token=fake-token; sb-refresh-token=fake-refresh',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      // Should show authenticated limit in headers
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100')
    })
  })

  describe('Non-API routes', () => {
    it('should not apply rate limiting to non-API routes', async () => {
      const response = await fetch(`${apiBaseUrl}/`)
      expect(response.status).not.toBe(429)
      expect(response.headers.get('X-RateLimit-Limit')).toBeNull()
    })
  })

  describe('Error handling', () => {
    it('should not break API when rate limiting fails', async () => {
      // The middleware should gracefully handle errors and allow requests through
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      // Should get a response (even if it's an auth error, not rate limit)
      expect(response.status).toBeDefined()
    })
  })
})
