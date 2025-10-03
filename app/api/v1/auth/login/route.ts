/**
 * POST /api/v1/auth/login
 * Authenticate user with email and password
 *
 * @tags Authentication
 * @security None (public endpoint)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validation/user'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // Initialize Supabase client

    const supabase = createRouteClient()

    // Authenticate user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (error) {
      logger.warn('Login attempt failed', {
        email: validatedData.email,
        error: error.message,
      })

      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/unauthorized',
          title: 'Unauthorized',
          status: 401,
          detail: 'Invalid email or password.',
        },
        { status: 401 }
      )
    }

    if (!data.user || !data.session) {
      throw new Error('Login failed - no user or session returned')
    }

    // Update last_login_at timestamp
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user.id)

    // Fetch user data
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    // Log successful login
    logger.info('User logged in successfully', {
      userId: data.user.id,
      email: validatedData.email,
    })

    // Return user and session data
    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        display_name: userData?.display_name || '',
        role: userData?.role || 'user',
        account_status: userData?.account_status || 'active',
        email_verified: data.user.email_confirmed_at !== null,
        created_at: data.user.created_at,
        last_login_at: data.user.last_sign_in_at,
        notification_preferences: userData?.notification_preferences || {
          email_enabled: true,
          in_app_enabled: true,
          events: [],
        },
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    })
  } catch (error) {
    return handleError(error, request.url)
  }
}
