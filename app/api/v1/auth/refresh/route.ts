/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 *
 * @tags Authentication
 * @security None (uses refresh token from request body)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'

export const runtime = 'edge'

// Validation schema for refresh request
const refreshSchema = z.object({
  refresh_token: z.string().min(1, { message: 'Refresh token is required' }),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = refreshSchema.parse(body)

    // Initialize Supabase client

    const supabase = createRouteClient()

    // Refresh session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: validatedData.refresh_token,
    })

    if (error) {
      logger.warn('Token refresh failed', {
        error: error.message,
      })

      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/unauthorized',
          title: 'Unauthorized',
          status: 401,
          detail: 'Invalid or expired refresh token.',
        },
        { status: 401 }
      )
    }

    if (!data.session) {
      throw new Error('Token refresh failed - no session returned')
    }

    // Log successful token refresh
    if (data.user) {
      logger.info('Token refreshed successfully', {
        userId: data.user.id,
      })
    }

    // Return new access token and expiration
    return NextResponse.json({
      access_token: data.session.access_token,
      expires_at: data.session.expires_at,
    })
  } catch (error) {
    return handleError(error, request.url)
  }
}
