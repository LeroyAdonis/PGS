import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'
import { publishPost as publishFacebookPost } from '@/lib/social-media/facebook'
import { publishPost as publishInstagramPost } from '@/lib/social-media/instagram'
import { publishTweet, uploadMedia } from '@/lib/social-media/twitter'
import { publishPost as publishLinkedInPost } from '@/lib/social-media/linkedin'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * POST /api/v1/posts/[id]/publish
 *
 * Immediately publish a post to all platform_targets.
 * Creates post_publications records for each platform.
 * Updates post status to 'published' if all platforms succeed.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
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

    // Get post with platforms and social accounts
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(
        `
        id,
        status,
        caption,
        image_url,
        platform_targets,
        business_profiles!inner(owner_user_id),
        social_media_accounts!inner(
          id,
          platform,
          encrypted_token,
          connection_status
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

    // Check if post can be published
    if (post.status !== 'approved') {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Only approved posts can be published immediately',
        },
        { status: 400 }
      )
    }

    // Check if social accounts are connected
    if (!post.social_media_accounts || post.social_media_accounts.length === 0) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'No social media accounts connected',
        },
        { status: 400 }
      )
    }

    const platformTargets = post.platform_targets as string[]
    const socialAccounts = post.social_media_accounts as any[]

    // Create map of platform to account
    const accountMap = new Map<string, any>()
    socialAccounts.forEach((account) => {
      if (account.connection_status === 'connected') {
        accountMap.set(account.platform, account)
      }
    })

    // Publish to each platform
    const publicationResults = []
    let allSuccessful = true

    for (const platform of platformTargets) {
      const account = accountMap.get(platform)
      if (!account) {
        publicationResults.push({
          platform,
          status: 'failed',
          error: 'No connected account found for platform',
        })
        allSuccessful = false
        continue
      }

      try {
        // Decrypt token (simplified - in production use proper decryption)
        const accessToken = account.encrypted_token // Assume already decrypted for demo

        let publishResult
        switch (platform) {
          case 'facebook':
            publishResult = await publishFacebookPost({
              pageId: account.page_id || 'PAGE_ID', // Would be stored in account metadata
              accessToken,
              caption: post.caption,
              imageUrl: post.image_url || undefined,
            })
            break
          case 'instagram':
            publishResult = await publishInstagramPost({
              instagramAccountId: account.instagram_account_id || 'ACCOUNT_ID', // Would be stored in account metadata
              accessToken,
              caption: post.caption,
              imageUrl: post.image_url || undefined,
            })
            break
          case 'twitter':
            // Handle media upload for Twitter if image exists
            let mediaId
            if (post.image_url) {
              mediaId = await uploadMedia(post.image_url, accessToken)
            }
            publishResult = await publishTweet({
              accessToken,
              text: post.caption,
              mediaId,
            })
            break
          case 'linkedin':
            publishResult = await publishLinkedInPost({
              personUrn: account.person_urn || 'urn:li:person:USER_ID', // Would be stored in account metadata
              accessToken,
              text: post.caption,
              imageUrl: post.image_url || undefined,
            })
            break
          default:
            throw new Error(`Unsupported platform: ${platform}`)
        }

        // Create post_publication record
        const { error: pubError } = await supabase.from('post_publications').insert({
          post_id: postId,
          social_account_id: account.id,
          platform_post_id: publishResult.platformPostId,
          publish_status: 'published',
          published_at: publishResult.publishedAt.toISOString(),
          post_url: publishResult.postUrl,
        })

        if (pubError) {
          logger.error('Failed to create publication record', {
            postId,
            platform,
            error: pubError.message,
          })
        }

        publicationResults.push({
          platform,
          status: 'published',
          platformPostId: publishResult.platformPostId,
          postUrl: publishResult.postUrl,
        })
      } catch (error) {
        logger.error('Failed to publish to platform', {
          postId,
          platform,
          error: error instanceof Error ? error.message : 'Unknown error',
        })

        // Create failed publication record
        const { error: pubError } = await supabase.from('post_publications').insert({
          post_id: postId,
          social_account_id: account.id,
          publish_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          retry_count: 0,
        })

        if (pubError) {
          logger.error('Failed to create failed publication record', {
            postId,
            platform,
            error: pubError.message,
          })
        }

        publicationResults.push({
          platform,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        allSuccessful = false
      }
    }

    // Update post status
    const newStatus = allSuccessful ? 'published' : 'partially_published'
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        status: newStatus,
        published_at: allSuccessful ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)

    if (updateError) {
      logger.error('Failed to update post status', {
        postId,
        error: updateError.message,
      })
    }

    logger.info('Post publish attempt completed', {
      postId,
      userId: user.id,
      results: publicationResults,
      allSuccessful,
    })

    return NextResponse.json({
      success: true,
      data: {
        post: {
          id: postId,
          status: newStatus,
          published_at: allSuccessful ? new Date().toISOString() : null,
        },
        publications: publicationResults,
      },
    })
  } catch (error) {
    return handleError(error, 'POST /api/v1/posts/[id]/publish')
  }
}
