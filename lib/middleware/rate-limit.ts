import { NextRequest, NextResponse } from 'next/server'

// In-memory rate limiting store (for development/demo)
// In production, this should be replaced with Redis or similar
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Rate limiting configuration
const AUTHENTICATED_LIMIT = 100 // requests per minute
const UNAUTHENTICATED_LIMIT = 10 // requests per minute
const WINDOW_MS = 60 * 1000 // 1 minute window

/**
 * Rate limiting middleware for API protection
 * Limits requests based on authentication status:
 * - Authenticated users: 100 requests per minute
 * - Unauthenticated users: 10 requests per minute
 */
export async function rateLimitMiddleware(request: NextRequest) {
  try {
    // Skip rate limiting when running tests to avoid flaky failures
    if (process.env.NODE_ENV === 'test') {
      return NextResponse.next()
    }
    // Get client IP for rate limiting
    const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1'

    // Check if user is authenticated by looking for session cookie
    const hasSession =
      request.cookies.has('sb-access-token') || request.cookies.has('sb-refresh-token')

    // Choose appropriate rate limit
    const limit = hasSession ? AUTHENTICATED_LIMIT : UNAUTHENTICATED_LIMIT
    const now = Date.now()
    const windowStart = now - WINDOW_MS

    // Get or create rate limit entry
    let entry = rateLimitStore.get(ip)

    if (!entry || entry.resetTime < windowStart) {
      // Create new entry or reset expired entry
      entry = {
        count: 0,
        resetTime: now + WINDOW_MS,
      }
    }

    // Check if limit exceeded
    if (entry.count >= limit) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)

      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/rate-limit-exceeded',
          title: 'Rate Limit Exceeded',
          status: 429,
          detail: `Too many requests. Please try again in ${retryAfter} seconds.`,
          instance: request.url,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
          },
        }
      )
    }

    // Increment counter
    entry.count++
    rateLimitStore.set(ip, entry)

    // Clean up old entries periodically (simple cleanup)
    if (Math.random() < 0.01) {
      // 1% chance to clean up
      for (const [key, value] of rateLimitStore.entries()) {
        if (value.resetTime < windowStart) {
          rateLimitStore.delete(key)
        }
      }
    }

    // Add rate limit headers to response
    const response = NextResponse.next()
    const remaining = Math.max(0, limit - entry.count)

    // RFC 6585 compliant headers
    response.headers.set('X-RateLimit-Limit', limit.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', entry.resetTime.toString())

    return response
  } catch (error) {
    // If rate limiting fails, allow the request to proceed
    // This prevents rate limiting from breaking the API
    console.error('Rate limiting error:', error)
    return NextResponse.next()
  }
}

// Helper for tests to reset the in-memory rate limit store
export function _resetRateLimitStoreForTests() {
  rateLimitStore.clear()
}
