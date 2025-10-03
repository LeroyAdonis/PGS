import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'
import { z } from 'zod'

const topPostsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
  sort_by: z
    .enum(['likes', 'comments', 'shares', 'engagement_rate', 'reach'])
    .default('engagement_rate'),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
})

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = topPostsQuerySchema.parse({
      limit: searchParams.get('limit'),
      sort_by: searchParams.get('sort_by'),
      from_date: searchParams.get('from_date'),
      to_date: searchParams.get('to_date'),
    })

    // Get user's business profile
    const { data: businessProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('owner_user_id', user.id)
      .single()

    if (profileError || !businessProfile) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Business profile not found' },
        { status: 404 }
      )
    }

    // First get analytics records with post publication info
    let analyticsQuery = supabase.from('analytics_records').select(`
        id,
        platform,
        likes,
        comments,
        shares,
        reach,
        engagement_rate,
        collected_at,
        post_publications!inner(
          post_id
        )
      `)

    // Apply date filters if provided
    if (queryParams.from_date) {
      analyticsQuery = analyticsQuery.gte('collected_at', queryParams.from_date)
    }
    if (queryParams.to_date) {
      analyticsQuery = analyticsQuery.lte('collected_at', queryParams.to_date)
    }

    const { data: analytics, error: analyticsError } = await analyticsQuery

    if (analyticsError) {
      logger.error('Failed to fetch analytics for top posts', {
        userId: user.id,
        businessProfileId: businessProfile.id,
        error: analyticsError.message,
      })
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Failed to fetch analytics' },
        { status: 500 }
      )
    }

    // Get unique post IDs from analytics
    const postIds = [
      ...new Set(analytics?.map((r) => r.post_publications[0]?.post_id).filter(Boolean) || []),
    ]

    if (postIds.length === 0) {
      return NextResponse.json({
        posts: [],
        total_posts: 0,
        sort_by: queryParams.sort_by,
        limit: queryParams.limit,
      })
    }

    // Get post details for these post IDs, ensuring they belong to the user
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, caption, image_url, status, created_at, platform_targets')
      .eq('business_profile_id', businessProfile.id)
      .in('id', postIds)

    if (postsError) {
      logger.error('Failed to fetch posts for top posts analytics', {
        userId: user.id,
        error: postsError.message,
      })
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Failed to fetch post details' },
        { status: 500 }
      )
    }

    // Create post lookup map
    const postMap = new Map(posts?.map((p) => [p.id, p]) || [])

    // Group analytics by post and calculate totals
    const postAnalytics = analytics?.reduce(
      (acc, record) => {
        const postId = record.post_publications[0]?.post_id
        const post = postMap.get(postId)

        if (!post || !postId) return acc // Skip if post not found or not owned by user

        if (!acc[postId]) {
          acc[postId] = {
            post_id: postId,
            post: {
              id: post.id,
              caption: post.caption,
              image_url: post.image_url,
              status: post.status,
              created_at: post.created_at,
              platform_targets: post.platform_targets,
            },
            platforms: {},
            total_likes: 0,
            total_comments: 0,
            total_shares: 0,
            total_reach: 0,
            total_engagement: 0,
            avg_engagement_rate: 0,
            records_count: 0,
          }
        }

        // Track per-platform metrics
        const platform = record.platform
        if (!acc[postId].platforms[platform]) {
          acc[postId].platforms[platform] = {
            likes: 0,
            comments: 0,
            shares: 0,
            reach: 0,
            engagement_rate: 0,
          }
        }

        acc[postId].platforms[platform].likes += record.likes || 0
        acc[postId].platforms[platform].comments += record.comments || 0
        acc[postId].platforms[platform].shares += record.shares || 0
        acc[postId].platforms[platform].reach += record.reach || 0
        acc[postId].platforms[platform].engagement_rate += record.engagement_rate || 0

        // Update totals
        acc[postId].total_likes += record.likes || 0
        acc[postId].total_comments += record.comments || 0
        acc[postId].total_shares += record.shares || 0
        acc[postId].total_reach += record.reach || 0
        acc[postId].total_engagement +=
          (record.likes || 0) + (record.comments || 0) + (record.shares || 0)
        acc[postId].records_count += 1

        return acc
      },
      {} as Record<string, any>
    )

    // Calculate average engagement rate and sort
    const sortedPosts = postAnalytics
      ? Object.values(postAnalytics)
          .map((postData: any) => {
            // Calculate average engagement rate
            if (postData.records_count > 0) {
              postData.avg_engagement_rate = postData.total_engagement / postData.total_reach || 0
            }

            // Calculate sort value based on query parameter
            let sortValue = 0
            switch (queryParams.sort_by) {
              case 'likes':
                sortValue = postData.total_likes
                break
              case 'comments':
                sortValue = postData.total_comments
                break
              case 'shares':
                sortValue = postData.total_shares
                break
              case 'reach':
                sortValue = postData.total_reach
                break
              case 'engagement_rate':
              default:
                sortValue = postData.avg_engagement_rate
                break
            }
            postData.sort_value = sortValue

            return postData
          })
          .sort((a: any, b: any) => b.sort_value - a.sort_value)
          .slice(0, queryParams.limit)
      : []

    const response = {
      posts: sortedPosts,
      total_posts: sortedPosts.length,
      sort_by: queryParams.sort_by,
      limit: queryParams.limit,
    }

    logger.info('Top posts analytics retrieved', {
      userId: user.id,
      businessProfileId: businessProfile.id,
      postsCount: sortedPosts.length,
      sortBy: queryParams.sort_by,
    })

    return NextResponse.json(response)
  } catch (error) {
    return handleError(error, 'GET /api/v1/analytics/top-posts')
  }
}
