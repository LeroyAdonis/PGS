import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'
import { cancelSubscriptionSchema } from '@/lib/validation/subscription'
import type { Database } from '@/lib/supabase/types'

/**
 * POST /api/v1/subscriptions/cancel
 * Cancel subscription (sets status to cancelled, access until next_billing_date)
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    const validation = cancelSubscriptionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation Error', message: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { reason } = validation.data

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

    // Check if already cancelled
    if (subscription.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Already Cancelled', message: 'Subscription is already cancelled' },
        { status: 400 }
      )
    }

    // Update subscription status to cancelled
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    if (updateError) {
      logger.error('Failed to cancel subscription', {
        userId: user.id,
        subscriptionId: subscription.id,
        error: updateError,
      })
      return NextResponse.json(
        { error: 'Update Error', message: 'Failed to cancel subscription' },
        { status: 500 }
      )
    }

    // Cancel Paystack subscription if it exists
    if (subscription.paystack_subscription_id) {
      try {
        // Note: In production, this would call Paystack API to cancel
        // For now, we just log it
        logger.info('Paystack subscription cancellation needed', {
          userId: user.id,
          paystackSubscriptionId: subscription.paystack_subscription_id,
        })
      } catch (paystackError) {
        // Log but don't fail the cancellation
        logger.error('Paystack cancellation failed', {
          userId: user.id,
          paystackSubscriptionId: subscription.paystack_subscription_id,
          error: paystackError,
        })
      }
    }

    // Log the cancellation
    logger.info('Subscription cancelled', {
      userId: user.id,
      subscriptionId: subscription.id,
      tier: subscription.tier,
      reason: reason || 'No reason provided',
      accessUntil: subscription.next_billing_date,
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: {
        id: subscription.id,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        accessUntil: subscription.next_billing_date,
      },
    })
  } catch (error) {
    return handleError(error, 'Failed to cancel subscription')
  }
}
