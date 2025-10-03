import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'
import { schedulePostSchema } from '@/lib/validation/post'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * POST /api/v1/posts/[id]/schedule
 *
 * Schedule a post for future publication.
 * Validates that scheduled_time is at least 5 minutes in the future.
 * Changes post status to 'scheduled'.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const postId = params.id

    // Parse and validate request body
    const body = await request.json()
    const validatedData = schedulePostSchema.parse(body)

    // Check post ownership and status
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(
        `
        id,
        status,
        business_profiles!inner(owner_user_id)
      `
      )
      .eq('id', postId)
      .eq('business_profiles.owner_user_id', user.id)
      .single()

    if (postError || !post) {
      logger.warn('Post not found or access denied', {
        postId,
        userId: user.id,
        error: postError?.message,
      })
      return NextResponse.json(
        { error: 'Not Found', message: 'Post not found or access denied' },
        { status: 404 }
      )
    }

    // Check if post can be scheduled
    if (post.status !== 'approved') {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Only approved posts can be scheduled',
        },
        { status: 400 }
      )
    }

    // Update post with scheduled time and status
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({
        status: 'scheduled',
        scheduled_time: validatedData.scheduledTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select()
      .single()

    if (updateError) {
      logger.error('Failed to schedule post', {
        postId,
        userId: user.id,
        error: updateError.message,
      })
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Failed to schedule post' },
        { status: 500 }
      )
    }

    logger.info('Post scheduled successfully', {
      postId,
      userId: user.id,
      scheduledTime: validatedData.scheduledTime,
    })

    return NextResponse.json({
      success: true,
      data: {
        post: {
          id: updatedPost.id,
          status: updatedPost.status,
          scheduled_time: updatedPost.scheduled_time,
        },
      },
    })
  } catch (error) {
    return handleError(error, 'POST /api/v1/posts/[id]/schedule')
  }
}
