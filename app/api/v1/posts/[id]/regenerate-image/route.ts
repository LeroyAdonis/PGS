import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'
import { generateImage } from '@/lib/gemini/image-generation'
import { z } from 'zod'

const regenerateImageSchema = z.object({
  imagePrompt: z.string().optional(), // Optional override for image prompt
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

    // Parse and validate request body
    const body = await request.json().catch(() => ({}))
    const validation = regenerateImageSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: 'Invalid request body',
          invalidParams: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { imagePrompt: newImagePrompt } = validation.data

    // Get post and verify ownership
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(
        `
        id,
        status,
        business_profile_id,
        image_prompt,
        caption
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

    // Check if post can have image regenerated (must be pending or approved)
    if (!['pending', 'approved'].includes(post.status)) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: `Cannot regenerate image for post with status: ${post.status}`,
        },
        { status: 400 }
      )
    }

    // Determine image prompt to use
    const imagePrompt = newImagePrompt || post.image_prompt
    if (!imagePrompt) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: 'No image prompt available for regeneration',
        },
        { status: 400 }
      )
    }

    // Generate new image
    let newImageUrl: string
    try {
      newImageUrl = await generateImage(imagePrompt, post.business_profile_id)
    } catch (error) {
      logger.error('Failed to regenerate image', {
        postId,
        businessProfileId: post.business_profile_id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/internal-server-error',
          title: 'Internal Server Error',
          status: 500,
          detail: 'Failed to generate new image',
        },
        { status: 500 }
      )
    }

    // Update post with new image
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({
        image_url: newImageUrl,
        image_prompt: imagePrompt, // Update prompt if it was overridden
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select('id, image_url, image_prompt, updated_at')
      .single()

    if (updateError) {
      logger.error('Failed to update post with new image', {
        postId,
        userId: user.id,
        error: updateError,
      })
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/internal-server-error',
          title: 'Internal Server Error',
          status: 500,
          detail: 'Failed to update post with new image',
        },
        { status: 500 }
      )
    }

    logger.info('Image regenerated successfully', {
      postId,
      userId: user.id,
      businessProfileId: post.business_profile_id,
      newImageUrl,
    })

    return NextResponse.json({
      success: true,
      post: {
        id: updatedPost.id,
        imageUrl: updatedPost.image_url,
        imagePrompt: updatedPost.image_prompt,
        updatedAt: updatedPost.updated_at,
      },
    })
  } catch (error) {
    return handleError(error, request.url)
  }
}
