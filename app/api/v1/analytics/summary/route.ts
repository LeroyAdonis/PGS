import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'
import { z } from 'zod'

const summaryQuerySchema = z.object({
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
    const queryParams = summaryQuerySchema.parse({
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

    // Build date filter for analytics
    let dateFilter = ''
    const dateParams: string[] = []
    if (queryParams.from_date) {
      dateFilter += ' AND ar.collected_at >= $' + (dateParams.length + 1)
      dateParams.push(queryParams.from_date)
    }
    if (queryParams.to_date) {
      dateFilter += ' AND ar.collected_at <= $' + (dateParams.length + 1)
      dateParams.push(queryParams.to_date)
    }

    // Get aggregated analytics using raw SQL for better performance
    const { data: summaryData, error: summaryError } = await supabase.rpc('get_analytics_summary', {
      p_business_profile_id: businessProfile.id,
      p_from_date: queryParams.from_date,
      p_to_date: queryParams.to_date,
    })

    if (summaryError) {
      logger.error('Failed to fetch analytics summary', {
        userId: user.id,
        businessProfileId: businessProfile.id,
        error: summaryError.message,
      })
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Failed to fetch analytics summary' },
        { status: 500 }
      )
    }

    // If RPC function doesn't exist, fall back to manual aggregation
    let fallbackSummary = null
    if (!summaryData) {
      const { data: analytics, error: analyticsError } = await supabase
        .from('analytics_records')
        .select(
          `
          likes,
          comments,
          shares,
          reach,
          engagement_rate,
          platform,
          post_publications!inner(
            posts!inner(business_profile_id)
          )
        `
        )
        .eq('post_publications.posts.business_profile_id', businessProfile.id)

      if (analyticsError) {
        logger.error('Failed to fetch analytics for summary', {
          userId: user.id,
          error: analyticsError.message,
        })
        return NextResponse.json(
          { error: 'Internal Server Error', message: 'Failed to fetch analytics' },
          { status: 500 }
        )
      }

      // Calculate summary manually
      const totals = analytics?.reduce(
        (acc, record) => {
          acc.total_likes += record.likes || 0
          acc.total_comments += record.comments || 0
          acc.total_shares += record.shares || 0
          acc.total_reach += record.reach || 0
          acc.total_engagement +=
            (record.likes || 0) + (record.comments || 0) + (record.shares || 0)
          acc.records_count += 1
          return acc
        },
        {
          total_likes: 0,
          total_comments: 0,
          total_shares: 0,
          total_reach: 0,
          total_engagement: 0,
          records_count: 0,
        }
      ) || {
        total_likes: 0,
        total_comments: 0,
        total_shares: 0,
        total_reach: 0,
        total_engagement: 0,
        records_count: 0,
      }

      // Get post counts
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('status')
        .eq('business_profile_id', businessProfile.id)

      if (postsError) {
        logger.error('Failed to fetch posts for summary', {
          userId: user.id,
          error: postsError.message,
        })
      }

      const postStats = posts?.reduce(
        (acc, post) => {
          acc.total_posts += 1
          if (post.status === 'published') acc.published_posts += 1
          if (post.status === 'scheduled') acc.scheduled_posts += 1
          return acc
        },
        { total_posts: 0, published_posts: 0, scheduled_posts: 0 }
      ) || { total_posts: 0, published_posts: 0, scheduled_posts: 0 }

      fallbackSummary = {
        total_posts: postStats.total_posts,
        published_posts: postStats.published_posts,
        scheduled_posts: postStats.scheduled_posts,
        total_likes: totals.total_likes,
        total_comments: totals.total_comments,
        total_shares: totals.total_shares,
        total_reach: totals.total_reach,
        avg_engagement_rate:
          totals.records_count > 0 ? totals.total_engagement / totals.total_reach : 0,
        total_platforms: new Set(analytics?.map((r) => r.platform) || []).size,
      }
    }

    const response = summaryData || fallbackSummary

    logger.info('Analytics summary retrieved', {
      userId: user.id,
      businessProfileId: businessProfile.id,
      totalPosts: response.total_posts,
    })

    return NextResponse.json(response)
  } catch (error) {
    return handleError(error, 'GET /api/v1/analytics/summary')
  }
}
