import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'

// Validation schema
const suspendUserSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
})

export const runtime = 'edge'

// POST /api/v1/admin/users/[id]/suspend - Suspend a user
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check admin role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/unauthorized',
          status: 401,
          title: 'Unauthorized',
          detail: 'Authentication required',
        },
        { status: 401 }
      )
    }

    // Check if user has admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/forbidden',
          status: 403,
          title: 'Forbidden',
          detail: 'Admin access required',
        },
        { status: 403 }
      )
    }

    const userId = params.id

    // Validate request body
    const body = await request.json()
    const validatedData = suspendUserSchema.parse(body)
    const { reason } = validatedData

    // Check if user exists and is not already suspended
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, account_status')
      .eq('id', userId)
      .single()

    if (fetchError || !targetUser) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/not-found',
          status: 404,
          title: 'User Not Found',
          detail: 'User does not exist',
        },
        { status: 404 }
      )
    }

    if (targetUser.account_status === 'suspended') {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/validation-error',
          status: 400,
          title: 'Validation Error',
          detail: 'User is already suspended',
        },
        { status: 400 }
      )
    }

    // Suspend the user
    const { error: suspendError } = await supabase
      .from('users')
      .update({
        account_status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspension_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (suspendError) {
      logger.error('Failed to suspend user', {
        error: suspendError,
        userId: user.id,
        targetUserId: userId,
      })
      return handleError(suspendError, request.url)
    }

    logger.info('Admin suspended user', {
      userId: user.id,
      targetUserId: userId,
      targetUserEmail: targetUser.email,
      reason,
    })

    return NextResponse.json({
      message: 'User suspended successfully',
      user: {
        id: targetUser.id,
        email: targetUser.email,
        account_status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspension_reason: reason,
      },
    })
  } catch (error) {
    return handleError(error, request.url)
  }
}
