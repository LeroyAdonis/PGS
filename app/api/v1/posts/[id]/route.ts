/**
 * GET /api/v1/posts/[id] - Get single post
 * PUT /api/v1/posts/[id] - Update post
 * DELETE /api/v1/posts/[id] - Delete post (soft delete)
 *
 * @tags Posts
 * @security BearerAuth
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { updatePostSchema } from '@/lib/validation/post'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'

export const runtime = 'edge'

/**
 * GET /api/v1/posts/[id]
 * Get single post by ID
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get authenticated user

    const supabase = createRouteClient()

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

    // Get post with business profile check
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(
        `
        id,
        business_profile_id,
        caption,
        language,
        image_url,
        image_prompt,
        hashtags,
        platform_targets,
        status,
        scheduled_time,
        published_at,
        created_at,
        updated_at,
        user_edits,
        ai_model_version,
        generation_prompt,
        business_profiles!inner(owner_user_id)
      `
      )
      .eq('id', params.id)
      .eq('business_profiles.owner_user_id', user.id)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/not-found',
          title: 'Not Found',
          status: 404,
          detail: 'Post not found or access denied.',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      post: {
        id: post.id,
        caption: post.caption,
        language: post.language,
        imageUrl: post.image_url,
        imagePrompt: post.image_prompt,
        hashtags: post.hashtags,
        platformTargets: post.platform_targets,
        status: post.status,
        scheduledTime: post.scheduled_time,
        publishedAt: post.published_at,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        userEdits: post.user_edits,
        aiModelVersion: post.ai_model_version,
        generationPrompt: post.generation_prompt,
      },
    })
  } catch (error) {
    return handleError(error, request.url)
  }
}

/**
 * PUT /api/v1/posts/[id]
 * Update post (caption, hashtags, platforms)
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get authenticated user

    const supabase = createRouteClient()

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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updatePostSchema.parse(body)

    // Get current post to track changes
    const { data: currentPost, error: getError } = await supabase
      .from('posts')
      .select(
        `
        id,
        business_profile_id,
        caption,
        language,
        image_url,
        hashtags,
        platform_targets,
        status,
        scheduled_time,
        published_at,
        created_at,
        updated_at,
        user_edits,
        business_profiles!inner(owner_user_id)
      `
      )
      .eq('id', params.id)
      .eq('business_profiles.owner_user_id', user.id)
      .single()

    if (getError || !currentPost) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/not-found',
          title: 'Not Found',
          status: 404,
          detail: 'Post not found or access denied.',
        },
        { status: 404 }
      )
    }

    // Track user edits
    const userEdits = currentPost.user_edits || []
    const timestamp = new Date().toISOString()

    // Build update object
    const updates: any = {
      updated_at: timestamp,
    }

    if (validatedData.caption !== undefined) {
      if (validatedData.caption !== currentPost.caption) {
        userEdits.push({
          field: 'caption',
          old_value: currentPost.caption,
          new_value: validatedData.caption,
          timestamp,
        })
        updates.caption = validatedData.caption
      }
    }

    if (validatedData.hashtags !== undefined) {
      if (JSON.stringify(validatedData.hashtags) !== JSON.stringify(currentPost.hashtags)) {
        userEdits.push({
          field: 'hashtags',
          old_value: currentPost.hashtags,
          new_value: validatedData.hashtags,
          timestamp,
        })
        updates.hashtags = validatedData.hashtags
      }
    }

    if (validatedData.platforms !== undefined) {
      if (
        JSON.stringify(validatedData.platforms) !== JSON.stringify(currentPost.platform_targets)
      ) {
        userEdits.push({
          field: 'platform_targets',
          old_value: currentPost.platform_targets,
          new_value: validatedData.platforms,
          timestamp,
        })
        updates.platform_targets = validatedData.platforms
      }
    }

    if (validatedData.imageUrl !== undefined) {
      updates.image_url = validatedData.imageUrl
      userEdits.push({
        field: 'image_url',
        old_value: currentPost.image_url,
        new_value: validatedData.imageUrl,
        timestamp,
      })
    }

    // Only update if there are changes
    if (Object.keys(updates).length > 1) {
      // More than just updated_at
      updates.user_edits = userEdits

      const { data: updatedPost, error: updateError } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', params.id)
        .select(
          `
          id,
          caption,
          language,
          image_url,
          hashtags,
          platform_targets,
          status,
          scheduled_time,
          published_at,
          created_at,
          updated_at,
          user_edits
        `
        )
        .single()

      if (updateError) {
        throw updateError
      }

      // Log successful update
      logger.info('Post updated successfully', {
        postId: params.id,
        businessProfileId: currentPost.business_profile_id,
        changes: Object.keys(updates).filter((key) => key !== 'updated_at' && key !== 'user_edits'),
      })

      return NextResponse.json({
        post: {
          id: updatedPost.id,
          caption: updatedPost.caption,
          language: updatedPost.language,
          imageUrl: updatedPost.image_url,
          hashtags: updatedPost.hashtags,
          platformTargets: updatedPost.platform_targets,
          status: updatedPost.status,
          scheduledTime: updatedPost.scheduled_time,
          publishedAt: updatedPost.published_at,
          createdAt: updatedPost.created_at,
          updatedAt: updatedPost.updated_at,
          userEdits: updatedPost.user_edits,
        },
      })
    } else {
      // No changes, return current post
      return NextResponse.json({
        post: {
          id: currentPost.id,
          caption: currentPost.caption,
          language: currentPost.language,
          imageUrl: currentPost.image_url,
          hashtags: currentPost.hashtags,
          platformTargets: currentPost.platform_targets,
          status: currentPost.status,
          scheduledTime: currentPost.scheduled_time,
          publishedAt: currentPost.published_at,
          createdAt: currentPost.created_at,
          updatedAt: currentPost.updated_at,
          userEdits: currentPost.user_edits,
        },
      })
    }
  } catch (error) {
    return handleError(error, request.url)
  }
}

/**
 * DELETE /api/v1/posts/[id]
 * Soft delete post (set status to 'rejected')
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get authenticated user

    const supabase = createRouteClient()

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

    // Get current post to check ownership
    const { data: currentPost, error: getError } = await supabase
      .from('posts')
      .select(
        `
        id,
        business_profile_id,
        status,
        business_profiles!inner(owner_user_id)
      `
      )
      .eq('id', params.id)
      .eq('business_profiles.owner_user_id', user.id)
      .single()

    if (getError || !currentPost) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/not-found',
          title: 'Not Found',
          status: 404,
          detail: 'Post not found or access denied.',
        },
        { status: 404 }
      )
    }

    // Check if post can be deleted (not published)
    if (currentPost.status === 'published') {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/forbidden',
          title: 'Forbidden',
          status: 403,
          detail: 'Cannot delete published posts.',
        },
        { status: 403 }
      )
    }

    // Soft delete by setting status to 'rejected'
    const { error: deleteError } = await supabase
      .from('posts')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (deleteError) {
      throw deleteError
    }

    // Log successful deletion
    logger.info('Post deleted successfully', {
      postId: params.id,
      businessProfileId: currentPost.business_profile_id,
    })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    return handleError(error, request.url)
  }
}
