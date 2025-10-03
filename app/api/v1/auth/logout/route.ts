/**
 * POST /api/v1/auth/logout
 * Invalidate current user session
 *
 * @tags Authentication
 * @security BearerAuth
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client

    const supabase = createRouteClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Fallback: accept Authorization: Bearer <token> header for non-cookie clients (tests / API clients)
      const authHeader =
        request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const accessToken = authHeader.split(' ')[1]
        const supabaseAuthUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/logout`

        try {
          const resp = await fetch(supabaseAuthUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })

          if (!resp.ok) {
            return NextResponse.json(
              {
                type: 'https://api.purpleglowsocial.co.za/errors/unauthorized',
                title: 'Unauthorized',
                status: 401,
                detail: 'Invalid or expired token.',
              },
              { status: 401 }
            )
          }

          // Log successful logout via token
          logger.info('User logged out via bearer token')
          return new NextResponse(null, { status: 204 })
        } catch (err) {
          // If fetch to Supabase fails, return 500
          logger.error('Error calling Supabase logout endpoint', { error: err })
          return NextResponse.json(
            {
              type: 'https://api.purpleglowsocial.co.za/errors/server-error',
              title: 'Server Error',
              status: 500,
              detail: 'Failed to process logout request.',
            },
            { status: 500 }
          )
        }
      }

      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/unauthorized',
          title: 'Unauthorized',
          status: 401,
          detail: 'No active session found.',
        },
        { status: 401 }
      )
    }

    // Sign out user (invalidates session)
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    // Log successful logout
    logger.info('User logged out successfully', {
      userId: user.id,
    })

    // Return 204 No Content
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleError(error, request.url)
  }
}
