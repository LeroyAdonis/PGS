import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'
import crypto from 'crypto'

export const runtime = 'nodejs'

/**
 * Paystack Webhook Handler
 *
 * Handles webhook events from Paystack for subscription and payment updates.
 * Supported events:
 * - charge.success: Payment successful, update subscription and create billing transaction
 * - subscription.create: New subscription created
 * - subscription.disable: Subscription cancelled/disabled
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      logger.warn('Invalid Paystack webhook signature', {
        signature: signature?.substring(0, 10) + '...',
        bodyLength: body.length,
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    logger.info('Paystack webhook received', {
      event: event.event,
      reference: event.data?.reference,
      customer: event.data?.customer?.email,
    })

    const supabase = createClient()

    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(supabase, event.data)
        break

      case 'subscription.create':
        await handleSubscriptionCreate(supabase, event.data)
        break

      case 'subscription.disable':
        await handleSubscriptionDisable(supabase, event.data)
        break

      default:
        logger.info('Unhandled Paystack webhook event', {
          event: event.event,
          reference: event.data?.reference,
        })
        // Return 200 for unhandled events to prevent retries
        return NextResponse.json({ status: 'ignored' })
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    logger.error('Paystack webhook processing failed', { error })
    return handleError(error, request.url)
  }
}

/**
 * Verify Paystack webhook signature
 */
function verifyWebhookSignature(body: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET
  if (!secret || !signature) {
    return false
  }

  const expectedSignature = crypto.createHmac('sha512', secret).update(body).digest('hex')

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}

/**
 * Handle successful charge event
 * Updates subscription status and creates billing transaction record
 */
async function handleChargeSuccess(supabase: any, data: any) {
  const { reference, amount, customer, metadata } = data

  logger.info('Processing charge.success', {
    reference,
    amount: amount / 100, // Convert kobo to ZAR
    customer: customer.email,
    metadata,
  })

  // Find subscription by Paystack customer code or reference
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('id, owner_user_id, tier, status')
    .eq('paystack_customer_code', customer.customer_code)
    .single()

  if (subError || !subscription) {
    logger.error('Subscription not found for charge.success', {
      customerCode: customer.customer_code,
      reference,
      error: subError,
    })
    throw new Error('Subscription not found')
  }

  // Update subscription status if it was pending
  if (subscription.status === 'pending_payment') {
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    if (updateError) {
      logger.error('Failed to update subscription status', {
        subscriptionId: subscription.id,
        error: updateError,
      })
      throw updateError
    }

    logger.info('Subscription activated', {
      subscriptionId: subscription.id,
      userId: subscription.owner_user_id,
    })
  }

  // Create billing transaction record
  const { error: transactionError } = await supabase.from('billing_transactions').insert({
    subscription_id: subscription.id,
    owner_user_id: subscription.owner_user_id,
    paystack_reference: reference,
    amount: amount / 100, // Convert from kobo to ZAR
    currency: 'ZAR',
    status: 'completed',
    transaction_type: 'subscription_payment',
    paystack_data: data,
    created_at: new Date().toISOString(),
  })

  if (transactionError) {
    logger.error('Failed to create billing transaction', {
      subscriptionId: subscription.id,
      reference,
      error: transactionError,
    })
    throw transactionError
  }

  logger.info('Billing transaction created', {
    subscriptionId: subscription.id,
    reference,
    amount: amount / 100,
  })
}

/**
 * Handle subscription creation event
 * Updates subscription with Paystack subscription details
 */
async function handleSubscriptionCreate(supabase: any, data: any) {
  const { customer, subscription_code, plan } = data

  logger.info('Processing subscription.create', {
    customer: customer.email,
    subscriptionCode: subscription_code,
    plan: plan.name,
  })

  // Update subscription with Paystack details
  const { error } = await supabase
    .from('subscriptions')
    .update({
      paystack_subscription_code: subscription_code,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('paystack_customer_code', customer.customer_code)

  if (error) {
    logger.error('Failed to update subscription with Paystack code', {
      customerCode: customer.customer_code,
      subscriptionCode: subscription_code,
      error,
    })
    throw error
  }

  logger.info('Subscription updated with Paystack details', {
    customerCode: customer.customer_code,
    subscriptionCode: subscription_code,
  })
}

/**
 * Handle subscription disable event
 * Updates subscription status to cancelled
 */
async function handleSubscriptionDisable(supabase: any, data: any) {
  const { subscription_code } = data

  logger.info('Processing subscription.disable', {
    subscriptionCode: subscription_code,
  })

  // Update subscription status
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('paystack_subscription_code', subscription_code)

  if (error) {
    logger.error('Failed to cancel subscription', {
      subscriptionCode: subscription_code,
      error,
    })
    throw error
  }

  logger.info('Subscription cancelled', {
    subscriptionCode: subscription_code,
  })
}
