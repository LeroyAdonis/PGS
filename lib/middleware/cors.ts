import { NextRequest, NextResponse } from 'next/server'

// CORS configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':
    process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_APP_URL || 'https://purpleglowsocial.com'
      : '*', // Allow all origins in development
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'User-Agent',
    'DNT',
    'Cache-Control',
    'X-Custom-Header',
  ].join(', '),
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 hours
}

// Security headers configuration
const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.paystack.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.supabase.co https://*.supabase.co https://api.paystack.co https://generativelanguage.googleapis.com",
    "frame-src 'self' https://js.stripe.com https://checkout.paystack.com https://www.facebook.com https://platform.twitter.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy': [
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'screen-wake-lock=(), web-share=(), interest-cohort=()',
  ].join(', '),

  // HSTS (HTTP Strict Transport Security) - only in production
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  }),

  // Remove server information
  'X-Powered-By': '',

  // Prevent caching of sensitive content
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

/**
 * CORS and Security Headers Middleware
 * Handles CORS preflight requests and adds security headers to all responses
 */
export function corsAndSecurityHeadersMiddleware(request: NextRequest): NextResponse | null {
  const { method, headers } = request
  const origin = headers.get('origin')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

  // Handle CORS preflight requests
  if (method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })

    // Add CORS headers
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Validate origin for production
    if (process.env.NODE_ENV === 'production' && origin) {
      const allowedOrigins = [
        process.env.NEXT_PUBLIC_APP_URL,
        'https://purpleglowsocial.com',
        'https://www.purpleglowsocial.com',
      ].filter(Boolean)

      if (!allowedOrigins.includes(origin)) {
        return new NextResponse('Forbidden', { status: 403 })
      }
    }

    return response
  }

  // For API routes, add security headers to the response
  // This will be called by the main middleware to add headers to the final response
  if (isApiRoute) {
    return null // Let the main middleware handle adding headers to the response
  }

  return null
}

/**
 * Add security headers to a response
 * This function should be called on the final response before returning it
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    if (value) {
      // Only set non-empty values
      response.headers.set(key, value)
    }
  })

  // Add CORS headers for API routes
  const isApiRoute =
    response.url?.includes('/api/') || response.headers.get('x-path')?.startsWith('/api/')

  if (isApiRoute) {
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }

  return response
}

/**
 * Create a response with CORS and security headers
 * Utility function for consistent header application
 */
export function createSecureResponse(body: any, options: ResponseInit = {}): NextResponse {
  const response = NextResponse.json(body, options)
  return addSecurityHeaders(response)
}

/**
 * Create an error response with CORS and security headers
 * Utility function for consistent error responses
 */
export function createSecureErrorResponse(error: any, status: number = 500): NextResponse {
  const response = NextResponse.json(error, { status })
  return addSecurityHeaders(response)
}
