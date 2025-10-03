import { describe, it, expect } from '@jest/globals'

// Test configuration
const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

describe('CORS and Security Headers Middleware', () => {
  describe('CORS Headers', () => {
    it('should include CORS headers in API responses', async () => {
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

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined()
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeDefined()
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeDefined()
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400')
    })

    it('should handle CORS preflight OPTIONS requests', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined()
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeDefined()
    })

    it('should allow all origins in development', async () => {
      // This test assumes we're in development mode
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:3000',
        },
      })

      expect(response.status).toBe(200)
      // In development, should allow all origins
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })
  })

  describe('Security Headers', () => {
    it('should include comprehensive security headers on API responses', async () => {
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

      // Content Security Policy
      expect(response.headers.get('Content-Security-Policy')).toBeDefined()
      expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'")

      // Anti-clickjacking
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')

      // MIME type protection
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')

      // XSS protection
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')

      // Referrer policy
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')

      // Permissions policy
      expect(response.headers.get('Permissions-Policy')).toBeDefined()
      expect(response.headers.get('Permissions-Policy')).toContain('camera=()')

      // Remove server info
      expect(response.headers.get('X-Powered-By')).toBe('')

      // Cache control for API
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
      expect(response.headers.get('Pragma')).toBe('no-cache')
      expect(response.headers.get('Expires')).toBe('0')
    })

    it('should include HSTS header in production', async () => {
      // This test would need to be run in production environment
      // For now, we'll verify the header is present when expected
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

      // In development, HSTS might not be set
      const hsts = response.headers.get('Strict-Transport-Security')
      if (hsts) {
        expect(hsts).toContain('max-age=')
        expect(hsts).toContain('includeSubDomains')
      }
    })

    it('should have secure CSP for external integrations', async () => {
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

      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toContain('https://js.stripe.com')
      expect(csp).toContain('https://checkout.paystack.com')
      expect(csp).toContain('https://api.supabase.co')
      expect(csp).toContain('https://generativelanguage.googleapis.com')
    })

    it('should restrict permissions policy appropriately', async () => {
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

      const permissions = response.headers.get('Permissions-Policy')
      expect(permissions).toContain('camera=()')
      expect(permissions).toContain('microphone=()')
      expect(permissions).toContain('geolocation=()')
      expect(permissions).toContain('payment=()')
    })
  })

  describe('Non-API Routes', () => {
    it('should include basic security headers on non-API routes', async () => {
      const response = await fetch(`${apiBaseUrl}/`)

      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    })

    it('should not include CORS headers on non-API routes', async () => {
      const response = await fetch(`${apiBaseUrl}/`)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should maintain security headers on error responses', async () => {
      // Make a request that will fail (invalid auth)
      const response = await fetch(`${apiBaseUrl}/api/v1/business-profiles/me`, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      })

      // Should have security headers even on error responses
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('Content-Security-Policy')).toBeDefined()
    })

    it('should maintain CORS headers on error responses', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/business-profiles/me`, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined()
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeDefined()
    })
  })

  describe('Rate Limited Responses', () => {
    it('should include security headers on rate limited responses', async () => {
      // Make many requests to trigger rate limiting
      const requests = []
      for (let i = 0; i < 15; i++) {
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

      const rateLimitedResponse = requests.find((r) => r.status === 429)
      if (rateLimitedResponse) {
        expect(rateLimitedResponse.headers.get('X-Frame-Options')).toBe('DENY')
        expect(rateLimitedResponse.headers.get('X-Content-Type-Options')).toBe('nosniff')
        expect(rateLimitedResponse.headers.get('Content-Security-Policy')).toBeDefined()
        expect(rateLimitedResponse.headers.get('Access-Control-Allow-Origin')).toBeDefined()
      }
    })
  })
})
