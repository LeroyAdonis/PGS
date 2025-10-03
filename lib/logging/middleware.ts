import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

/**
 * Middleware to log HTTP requests and responses
 * Tracks request/response times for performance monitoring
 */
export function loggingMiddleware(request: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  // Log incoming request
  logger.logRequest(request.method, request.nextUrl.pathname, {
    requestId,
    userAgent: request.headers.get('user-agent') || undefined,
  })

  // Clone the request to read body if needed
  return async (next: () => Promise<NextResponse>) => {
    const response = await next()
    const duration = Date.now() - startTime

    // Log response
    logger.logResponse(request.method, request.nextUrl.pathname, response.status, duration, {
      requestId,
    })

    // Add request ID to response headers
    response.headers.set('X-Request-ID', requestId)

    return response
  }
}
