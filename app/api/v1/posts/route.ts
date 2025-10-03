/**
 * POST /api/v1/posts - Create new post with AI generation
 * GET /api/v1/posts - List posts with filtering and pagination
 *
 * @tags Posts
 * @security BearerAuth
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { createPostSchema, listPostsFiltersSchema } from '@/lib/validation/post'
import { generatePostCaption } from '@/lib/gemini/text-generation'
import { generateImage } from '@/lib/gemini/image-generation'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'

export const runtime = 'edge'

/**
 * GET /api/v1/posts
 * List posts for authenticated user's business profile
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const filters = {
      status: searchParams.get('status') || undefined,
      platform: searchParams.get('platform') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    }

    const validatedFilters = listPostsFiltersSchema.parse(filters)

    // Get user's business profile
    const { data: businessProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('owner_user_id', user.id)
      .single()

    if (profileError || !businessProfile) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/not-found',
          title: 'Not Found',
          status: 404,
          detail: 'Business profile not found. Please complete onboarding first.',
        },
        { status: 404 }
      )
    }

    // Build query
    let query = supabase
      .from('posts')
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
        updated_at
      `,
        { count: 'exact' }
      )
      .eq('business_profile_id', businessProfile.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (validatedFilters.status) {
      query = query.eq('status', validatedFilters.status)
    }

    if (validatedFilters.platform) {
      query = query.contains('platform_targets', [validatedFilters.platform])
    }

    if (validatedFilters.fromDate) {
      query = query.gte('created_at', validatedFilters.fromDate)
    }

    if (validatedFilters.toDate) {
      query = query.lte('created_at', validatedFilters.toDate)
    }

    // Apply pagination
    const from = (validatedFilters.page - 1) * validatedFilters.limit
    const to = from + validatedFilters.limit - 1
    query = query.range(from, to)

    const { data: posts, error: postsError, count } = await query

    if (postsError) {
      throw postsError
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / validatedFilters.limit)
    const hasNext = validatedFilters.page < totalPages
    const hasPrev = validatedFilters.page > 1

    return NextResponse.json({
      posts: posts || [],
      pagination: {
        page: validatedFilters.page,
        limit: validatedFilters.limit,
        total: count || 0,
        totalPages,
        hasNext,
        hasPrev,
      },
    })
  } catch (error) {
    return handleError(error, request.url)
  }
}

/**
 * POST /api/v1/posts
 * Create new post with AI-generated content
 */
export async function POST(request: NextRequest) {
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
    const validatedData = createPostSchema.parse(body)

    // Get business profile
    const { data: businessProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', validatedData.businessProfileId)
      .eq('owner_user_id', user.id)
      .single()

    if (profileError || !businessProfile) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/not-found',
          title: 'Not Found',
          status: 404,
          detail: 'Business profile not found or access denied.',
        },
        { status: 404 }
      )
    }

    // Check subscription limits
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('posts_used_current_cycle, posts_limit')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/not-found',
          title: 'Not Found',
          status: 404,
          detail: 'Subscription not found.',
        },
        { status: 404 }
      )
    }

    if (subscription.posts_used_current_cycle >= subscription.posts_limit) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/forbidden',
          title: 'Forbidden',
          status: 403,
          detail:
            'Monthly post limit reached. Upgrade subscription or wait for next billing cycle.',
        },
        { status: 403 }
      )
    }

    // Determine language (use override or business profile default)
    const language = validatedData.language || businessProfile.preferred_language

    // Generate caption for each platform
    const platformCaptions: Record<string, any> = {}
    const allHashtags: string[] = []

    for (const platform of validatedData.platforms) {
      try {
        const captionResult = await generatePostCaption({
          businessProfile: {
            name: businessProfile.business_name,
            industry: businessProfile.industry,
            targetAudience: businessProfile.target_audience,
            tone: businessProfile.content_tone,
            topics: businessProfile.content_topics,
          },
          language,
          platform,
          topic: validatedData.topic,
        })

        platformCaptions[platform] = {
          caption: captionResult.caption,
          hashtags: captionResult.hashtags,
          suggestedImagePrompt: captionResult.suggestedImagePrompt,
        }

        // Collect all hashtags (deduplicate later)
        allHashtags.push(...captionResult.hashtags)
      } catch (error) {
        logger.error('Failed to generate caption for platform', {
          platform,
          businessProfileId: businessProfile.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        // Continue with other platforms, but log the error
      }
    }

    if (Object.keys(platformCaptions).length === 0) {
      throw new Error('Failed to generate captions for any platform')
    }

    // Use the first platform's caption as the main caption
    const firstPlatform = Object.keys(platformCaptions)[0]
    const mainCaption = platformCaptions[firstPlatform].caption
    const mainImagePrompt =
      validatedData.imagePrompt || platformCaptions[firstPlatform].suggestedImagePrompt

    // Deduplicate hashtags
    const uniqueHashtags = [...new Set(allHashtags)].slice(0, 30) // Max 30 hashtags

    // Generate image if requested
    let imageUrl: string | null = null
    if (validatedData.generateImage && mainImagePrompt) {
      try {
        imageUrl = await generateImage(mainImagePrompt, businessProfile.id)
      } catch (error) {
        logger.error('Failed to generate image', {
          businessProfileId: businessProfile.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        // Continue without image - post can still be created
      }
    }

    // Create post record
    const { data: post, error: insertError } = await supabase
      .from('posts')
      .insert({
        business_profile_id: businessProfile.id,
        caption: mainCaption,
        language,
        image_url: imageUrl,
        image_prompt: mainImagePrompt,
        hashtags: uniqueHashtags,
        platform_targets: validatedData.platforms,
        status: 'pending',
        generation_prompt: validatedData.topic || 'General business content',
        ai_model_version: 'gemini-1.5-pro',
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // Update subscription usage
    await supabase
      .from('subscriptions')
      .update({
        posts_used_current_cycle: subscription.posts_used_current_cycle + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    // Log successful post creation
    logger.info('Post created successfully', {
      postId: post.id,
      businessProfileId: businessProfile.id,
      platforms: validatedData.platforms,
      hasImage: !!imageUrl,
    })

    return NextResponse.json(
      {
        post: {
          id: post.id,
          caption: post.caption,
          language: post.language,
          imageUrl: post.image_url,
          hashtags: post.hashtags,
          platformTargets: post.platform_targets,
          status: post.status,
          createdAt: post.created_at,
        },
        platformCaptions,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleError(error, request.url)
  }
}
