import type { NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'
import { rateLimitMiddleware } from './lib/middleware/rate-limit'
import { corsAndSecurityHeadersMiddleware, addSecurityHeaders } from './lib/middleware/cors'

/**
 * Next.js middleware to handle CORS, security headers, rate limiting, and authentication
 * Runs on all routes except static files
 */
export async function middleware(request: NextRequest) {
  // Handle CORS preflight requests and add security headers
  const corsResponse = corsAndSecurityHeadersMiddleware(request)
  if (corsResponse) {
    return corsResponse
  }

  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResponse = await rateLimitMiddleware(request)
    if (rateLimitResponse.status === 429) {
      return addSecurityHeaders(rateLimitResponse)
    }
  }

  // Update Supabase session for all other routes
  const response = await updateSession(request)

  // Add security headers to the response
  return addSecurityHeaders(response)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
