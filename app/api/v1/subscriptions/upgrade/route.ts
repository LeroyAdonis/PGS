import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'
import { initializeSubscriptionPayment } from '@/lib/paystack/subscriptions'
import { upgradeSubscriptionSchema } from '@/lib/validation/subscription'
import type { Database } from '@/lib/supabase/types'

/**
 * POST /api/v1/subscriptions/upgrade
 * Upgrade subscription tier (generates Paystack payment URL)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

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
    const validation = upgradeSubscriptionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation Error', message: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { tier } = validation.data

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

    // Check if upgrading to same or lower tier
    const tierOrder: Record<string, number> = { starter: 1, growth: 2, enterprise: 3 }
    if (tierOrder[tier] <= tierOrder[subscription.tier]) {
      return NextResponse.json(
        { error: 'Invalid Upgrade', message: 'Cannot upgrade to same or lower tier' },
        { status: 400 }
      )
    }

    // Get user's email for Paystack
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Not Found', message: 'User data not found' },
        { status: 404 }
      )
    }

    // Initialize payment with Paystack
    const paymentResponse = await initializeSubscriptionPayment(userData.email, tier, user.id)

    if (!paymentResponse.status) {
      logger.error('Paystack payment initialization failed', {
        userId: user.id,
        tier,
        error: paymentResponse.message,
      })
      return NextResponse.json(
        { error: 'Payment Error', message: 'Failed to initialize payment' },
        { status: 500 }
      )
    }

    // Log the upgrade attempt
    logger.info('Subscription upgrade initiated', {
      userId: user.id,
      fromTier: subscription.tier,
      toTier: tier,
      paystackReference: paymentResponse.data.reference,
    })

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResponse.data.authorization_url,
      reference: paymentResponse.data.reference,
      tier,
      amount: paymentResponse.data.amount / 100, // Convert from kobo to ZAR
      currency: 'ZAR',
    })
  } catch (error) {
    return handleError(error, 'Failed to upgrade subscription')
  }
}
