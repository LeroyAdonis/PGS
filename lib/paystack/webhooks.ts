import crypto from 'crypto'
import { logger } from '@/lib/logging/logger'

/**
 * Verify Paystack webhook signature
 * Ensures webhook requests are authentic and from Paystack
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET

  if (!secret) {
    throw new Error('Missing PAYSTACK_WEBHOOK_SECRET environment variable')
  }

  const hash = crypto.createHmac('sha512', secret).update(payload).digest('hex')

  return hash === signature
}

/**
 * Paystack webhook event types
 */
export type WebhookEvent =
  | 'charge.success'
  | 'subscription.create'
  | 'subscription.disable'
  | 'subscription.not_renew'
  | 'invoice.create'
  | 'invoice.update'
  | 'invoice.payment_failed'

/**
 * Process Paystack webhook event
 */
export async function processWebhookEvent(event: WebhookEvent, data: unknown) {
  logger.info(`Processing webhook event: ${event}`, { event, data })

  switch (event) {
    case 'charge.success':
      // Handle successful payment
      logger.info('Payment successful', { event, data })
      break

    case 'subscription.create':
      // Handle new subscription
      logger.info('Subscription created', { event, data })
      break

    case 'subscription.disable':
      // Handle subscription cancellation
      logger.info('Subscription disabled', { event, data })
      break

    case 'subscription.not_renew':
      // Handle subscription not renewing
      logger.info('Subscription not renewing', { event, data })
      break

    case 'invoice.create':
      // Handle invoice creation
      logger.info('Invoice created', { event, data })
      break

    case 'invoice.update':
      // Handle invoice update
      logger.info('Invoice updated', { event, data })
      break

    case 'invoice.payment_failed':
      // Handle failed payment
      logger.warn('Invoice payment failed', { event, data })
      break

    default:
      logger.warn(`Unknown webhook event: ${event}`, { event, data })
  }
}
