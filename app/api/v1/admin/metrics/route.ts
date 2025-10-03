import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'

export const runtime = 'edge'

// GET /api/v1/admin/metrics - Platform-wide analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteClient()

    // Check admin role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/unauthorized',
          status: 401,
          title: 'Unauthorized',
          detail: 'Authentication required',
        },
        { status: 401 }
      )
    }

    // Check if user has admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/forbidden',
          status: 403,
          title: 'Forbidden',
          detail: 'Admin access required',
        },
        { status: 403 }
      )
    }

    // Get user metrics
    const { data: userMetrics, error: userMetricsError } =
      await supabase.rpc('get_admin_user_metrics')

    if (userMetricsError) {
      logger.error('Failed to get user metrics', { error: userMetricsError, userId: user.id })
      return handleError(userMetricsError, request.url)
    }

    // Get subscription metrics
    const { data: subscriptionMetrics, error: subscriptionMetricsError } = await supabase.rpc(
      'get_admin_subscription_metrics'
    )

    if (subscriptionMetricsError) {
      logger.error('Failed to get subscription metrics', {
        error: subscriptionMetricsError,
        userId: user.id,
      })
      return handleError(subscriptionMetricsError, request.url)
    }

    // Get post metrics
    const { data: postMetrics, error: postMetricsError } =
      await supabase.rpc('get_admin_post_metrics')

    if (postMetricsError) {
      logger.error('Failed to get post metrics', { error: postMetricsError, userId: user.id })
      return handleError(postMetricsError, request.url)
    }

    // Get revenue metrics
    const { data: revenueMetrics, error: revenueMetricsError } = await supabase.rpc(
      'get_admin_revenue_metrics'
    )

    if (revenueMetricsError) {
      logger.error('Failed to get revenue metrics', { error: revenueMetricsError, userId: user.id })
      return handleError(revenueMetricsError, request.url)
    }

    // Get platform engagement metrics
    const { data: engagementMetrics, error: engagementMetricsError } = await supabase.rpc(
      'get_admin_engagement_metrics'
    )

    if (engagementMetricsError) {
      logger.error('Failed to get engagement metrics', {
        error: engagementMetricsError,
        userId: user.id,
      })
      return handleError(engagementMetricsError, request.url)
    }

    logger.info('Admin retrieved platform metrics', { userId: user.id })

    return NextResponse.json({
      metrics: {
        users: userMetrics?.[0] || {},
        subscriptions: subscriptionMetrics?.[0] || {},
        posts: postMetrics?.[0] || {},
        revenue: revenueMetrics?.[0] || {},
        engagement: engagementMetrics?.[0] || {},
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return handleError(error, request.url)
  }
}
