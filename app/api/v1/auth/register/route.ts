/**
 * POST /api/v1/auth/register
 * Register new user account
 *
 * @tags Authentication
 * @security None (public endpoint)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { registerSchema } from '@/lib/validation/user'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Initialize Supabase client

    const supabase = createRouteClient()

    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          display_name: validatedData.displayName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      // Check for duplicate email
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          {
            type: 'https://api.purpleglowsocial.co.za/errors/conflict',
            title: 'Conflict',
            status: 409,
            detail: 'An account with this email already exists.',
          },
          { status: 409 }
        )
      }

      throw error
    }

    if (!data.user || !data.session) {
      throw new Error('User creation failed - no user or session returned')
    }

    // Create user record in custom users table
    const { error: insertError } = await supabase.from('users').insert({
      id: data.user.id,
      email: validatedData.email,
      display_name: validatedData.displayName,
      role: 'user',
      account_status: 'active',
      email_verified: false,
    })

    if (insertError) {
      logger.error('Failed to create user record', {
        userId: data.user.id,
        error: insertError,
      })
      // Note: Supabase auth user still created, but custom table insert failed
      // User can still log in, but may have issues with other features
    }

    // Log successful registration
    logger.info('User registered successfully', {
      userId: data.user.id,
      email: validatedData.email,
    })

    // Return user and session data
    return NextResponse.json(
      {
        user: {
          id: data.user.id,
          email: data.user.email,
          display_name: validatedData.displayName,
          role: 'user',
          account_status: 'active',
          email_verified: false,
          created_at: data.user.created_at,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return handleError(error, request.url)
  }
}
