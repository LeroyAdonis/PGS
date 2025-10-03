import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'
import { z } from 'zod'

const approvePostSchema = z.object({
  // No body required for approve action
})

export const runtime = 'edge'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/unauthorized',
          title: 'Unauthorized',
          status: 401,
          detail: 'Authentication required',
        },
        { status: 401 }
      )
    }

    const postId = params.id

    // Validate request body (should be empty)
    const body = await request.json().catch(() => ({}))
    const validation = approvePostSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: 'Request body must be empty',
          invalidParams: validation.error.issues,
        },
        { status: 400 }
      )
    }

    // Get post and verify ownership
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(
        `
        id,
        status,
        business_profile_id
      `
      )
      .eq('id', postId)
      .eq('business_profiles.owner_user_id', user.id)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/not-found',
          title: 'Not Found',
          status: 404,
          detail: 'Post not found or access denied',
        },
        { status: 404 }
      )
    }

    // Check if post can be approved (must be pending)
    if (post.status !== 'pending') {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: `Post cannot be approved. Current status: ${post.status}, required: pending`,
        },
        { status: 400 }
      )
    }

    // Start transaction to update post and increment counter
    const { data: updatedPost, error: updateError } = await supabase.rpc('approve_post', {
      post_id: postId,
      user_id: user.id,
    })

    if (updateError) {
      logger.error('Failed to approve post', {
        postId,
        userId: user.id,
        error: updateError,
      })
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/internal-server-error',
          title: 'Internal Server Error',
          status: 500,
          detail: 'Failed to approve post',
        },
        { status: 500 }
      )
    }

    logger.info('Post approved successfully', {
      postId,
      userId: user.id,
      newStatus: 'approved',
    })

    return NextResponse.json({
      success: true,
      post: {
        id: updatedPost.id,
        status: updatedPost.status,
        approved_at: updatedPost.approved_at,
      },
    })
  } catch (error) {
    return handleError(error, request.url)
  }
}
