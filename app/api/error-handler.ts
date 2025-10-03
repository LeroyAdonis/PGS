import { NextResponse } from 'next/server'
import { handleError } from '@/lib/errors/handler'

/**
 * Wrapper for API route handlers with automatic error handling
 * Converts all errors to RFC 7807 Problem Details format
 *
 * @example
 * export const POST = withErrorHandler(async (request: NextRequest) => {
 *   // Your handler logic here
 *   return NextResponse.json({ success: true })
 * })
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      // Extract request path if available
      const request = args[0] as { url?: string }
      const instance = request?.url ? new URL(request.url).pathname : undefined

      return handleError(error, instance)
    }
  }
}
