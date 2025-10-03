import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'
import { z } from 'zod'

const rejectPostSchema = z.object({
  // No body required for reject action
})

export const runtime = 'edge'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteClient()

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
    const validation = rejectPostSchema.safeParse(body)
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

    // Check if post can be rejected (must be pending)
    if (post.status !== 'pending') {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: `Post cannot be rejected. Current status: ${post.status}, required: pending`,
        },
        { status: 400 }
      )
    }

    // Update post status to rejected
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select('id, status, updated_at')
      .single()

    if (updateError) {
      logger.error('Failed to reject post', {
        postId,
        userId: user.id,
        error: updateError,
      })
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/internal-server-error',
          title: 'Internal Server Error',
          status: 500,
          detail: 'Failed to reject post',
        },
        { status: 500 }
      )
    }

    logger.info('Post rejected successfully', {
      postId,
      userId: user.id,
      newStatus: 'rejected',
    })

    return NextResponse.json({
      success: true,
      post: {
        id: updatedPost.id,
        status: updatedPost.status,
        updated_at: updatedPost.updated_at,
      },
    })
  } catch (error) {
    return handleError(error, request.url)
  }
}
