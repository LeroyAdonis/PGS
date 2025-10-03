import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'
import { z } from 'zod'

const analyticsQuerySchema = z.object({
  from_date: z.string().optional(),
  to_date: z.string().optional(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteClient()

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

    // Verify post ownership
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, business_profiles!inner(owner_user_id)')
      .eq('id', postId)
      .eq('business_profiles.owner_user_id', user.id)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Post not found or access denied' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = analyticsQuerySchema.parse({
      from_date: searchParams.get('from_date'),
      to_date: searchParams.get('to_date'),
    })

    // Build analytics query
    let analyticsQuery = supabase
      .from('analytics_records')
      .select(
        `
        id,
        platform,
        likes,
        comments,
        shares,
        reach,
        engagement_rate,
        collected_at,
        post_publications!inner(post_id)
      `
      )
      .eq('post_publications.post_id', postId)

    // Apply date filters if provided
    if (queryParams.from_date) {
      analyticsQuery = analyticsQuery.gte('collected_at', queryParams.from_date)
    }
    if (queryParams.to_date) {
      analyticsQuery = analyticsQuery.lte('collected_at', queryParams.to_date)
    }

    const { data: analytics, error: analyticsError } = await analyticsQuery

    if (analyticsError) {
      logger.error('Failed to fetch post analytics', {
        postId,
        userId: user.id,
        error: analyticsError.message,
      })
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Failed to fetch analytics' },
        { status: 500 }
      )
    }

    // Group analytics by platform and calculate totals
    const platformAnalytics = analytics?.reduce(
      (acc, record) => {
        const platform = record.platform
        if (!acc[platform]) {
          acc[platform] = {
            platform,
            total_likes: 0,
            total_comments: 0,
            total_shares: 0,
            total_reach: 0,
            avg_engagement_rate: 0,
            records_count: 0,
            latest_collected_at: null,
          }
        }

        acc[platform].total_likes += record.likes || 0
        acc[platform].total_comments += record.comments || 0
        acc[platform].total_shares += record.shares || 0
        acc[platform].total_reach += record.reach || 0
        acc[platform].avg_engagement_rate += record.engagement_rate || 0
        acc[platform].records_count += 1

        // Track latest collection date
        if (
          !acc[platform].latest_collected_at ||
          new Date(record.collected_at) > new Date(acc[platform].latest_collected_at)
        ) {
          acc[platform].latest_collected_at = record.collected_at
        }

        return acc
      },
      {} as Record<string, any>
    )

    // Calculate average engagement rate
    if (platformAnalytics) {
      Object.values(platformAnalytics).forEach((platform: any) => {
        if (platform.records_count > 0) {
          platform.avg_engagement_rate = platform.avg_engagement_rate / platform.records_count
        }
      })
    }

    const response = {
      post_id: postId,
      platforms: platformAnalytics ? Object.values(platformAnalytics) : [],
      total_platforms: platformAnalytics ? Object.keys(platformAnalytics).length : 0,
    }

    logger.info('Post analytics retrieved', {
      postId,
      userId: user.id,
      platformsCount: response.total_platforms,
    })

    return NextResponse.json(response)
  } catch (error) {
    return handleError(error)
  }
}
