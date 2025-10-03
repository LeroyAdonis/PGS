import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'
import type { Database } from '@/lib/supabase/types'

/**
 * GET /api/v1/subscriptions/me
 * Get current user's subscription with usage metrics
 */
export async function GET(_request: NextRequest) {
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

    // Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Get business profile to calculate usage
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

    // Calculate usage metrics
    const [
      { count: postsUsed, error: postsError },
      { count: platformsConnected, error: platformsError },
      { data: storageData, error: storageError },
    ] = await Promise.all([
      // Posts used this cycle (created this month)
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('business_profile_id', businessProfile.id)
        .gte('created_at', subscription.billing_cycle_start),

      // Connected platforms
      supabase
        .from('social_media_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('business_profile_id', businessProfile.id)
        .eq('connection_status', 'connected'),

      // Storage used (sum of image sizes, but for now use a placeholder)
      supabase
        .from('posts')
        .select('image_url')
        .eq('business_profile_id', businessProfile.id)
        .not('image_url', 'is', null),
    ])

    if (postsError || platformsError || storageError) {
      logger.error('Failed to calculate subscription usage', {
        userId: user.id,
        postsError,
        platformsError,
        storageError,
      })
      // Continue with available data
    }

    // Calculate storage used (simplified - in production would sum actual file sizes)
    const storageUsed = storageData ? storageData.length * 5 : 0 // Rough estimate: 5MB per image

    const response = {
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
        billingCycleStart: subscription.billing_cycle_start,
        nextBillingDate: subscription.next_billing_date,
        trialEndDate: subscription.trial_end_date,
        cancelledAt: subscription.cancelled_at,
        createdAt: subscription.created_at,
      },
      usage: {
        postsUsed: postsUsed || 0,
        postsLimit: subscription.posts_limit,
        platformsConnected: platformsConnected || 0,
        platformsLimit: subscription.platforms_limit,
        storageUsedMB: storageUsed,
        storageLimitMB: subscription.storage_limit_mb,
        teamMembersCount: subscription.team_members_count,
        teamMembersLimit: subscription.team_members_limit,
      },
      limits: {
        postsRemaining: Math.max(0, subscription.posts_limit - (postsUsed || 0)),
        platformsRemaining: Math.max(0, subscription.platforms_limit - (platformsConnected || 0)),
        storageRemainingMB: Math.max(0, subscription.storage_limit_mb - storageUsed),
        teamMembersRemaining: Math.max(
          0,
          subscription.team_members_limit - subscription.team_members_count
        ),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleError(error, 'Failed to get subscription')
  }
}
