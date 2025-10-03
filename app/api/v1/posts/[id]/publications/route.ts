import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/v1/posts/[id]/publications
 *
 * Get publication status and details for each platform target.
 * Returns per-platform status, errors, and URLs.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
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

    // Get post with publications
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(
        `
        id,
        platform_targets,
        business_profiles!inner(owner_user_id),
        post_publications(
          id,
          platform,
          publish_status,
          platform_post_id,
          post_url,
          published_at,
          error_message,
          retry_count,
          created_at,
          updated_at
        )
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

    const platformTargets = post.platform_targets as string[]
    const publications = post.post_publications || []

    // Create map of publications by platform
    const publicationMap = new Map<string, any>()
    publications.forEach((pub: any) => {
      publicationMap.set(pub.platform, pub)
    })

    // Build response for each platform target
    const results = platformTargets.map((platform) => {
      const publication = publicationMap.get(platform)

      if (!publication) {
        return {
          platform,
          status: 'pending',
          message: 'Publication not yet attempted',
        }
      }

      return {
        platform,
        status: publication.publish_status,
        platformPostId: publication.platform_post_id,
        postUrl: publication.post_url,
        publishedAt: publication.published_at,
        errorMessage: publication.error_message,
        retryCount: publication.retry_count,
        createdAt: publication.created_at,
        updatedAt: publication.updated_at,
      }
    })

    logger.info('Retrieved post publications', {
      postId,
      userId: user.id,
      platformCount: results.length,
    })

    return NextResponse.json({
      success: true,
      data: {
        postId,
        publications: results,
      },
    })
  } catch (error) {
    return handleError(error, 'GET /api/v1/posts/[id]/publications')
  }
}
