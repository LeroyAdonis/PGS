import { paystackClient } from './client'
import type { SubscriptionTier, SubscriptionPlan } from './types'

/**
 * Subscription tier pricing in ZAR (South African Rand)
 * Prices are in cents (kobo)
 */
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  starter: {
    tier: 'starter',
    name: 'Starter',
    price: 49900, // R499.00 in cents
    currency: 'ZAR',
    interval: 'monthly',
    features: {
      postsPerMonth: 30,
      platforms: 2,
      teamMembers: 1,
      storageGB: 2,
      automation: false,
      prioritySupport: false,
      whiteLabeling: false,
    },
  },
  growth: {
    tier: 'growth',
    name: 'Growth',
    price: 99900, // R999.00 in cents
    currency: 'ZAR',
    interval: 'monthly',
    features: {
      postsPerMonth: 120,
      platforms: 4,
      teamMembers: 3,
      storageGB: 10,
      automation: true,
      prioritySupport: true,
      whiteLabeling: false,
    },
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    price: 199900, // R1999.00 in cents
    currency: 'ZAR',
    interval: 'monthly',
    features: {
      postsPerMonth: 9999, // Unlimited
      platforms: 4,
      teamMembers: 10,
      storageGB: 50,
      automation: true,
      prioritySupport: true,
      whiteLabeling: true,
    },
  },
}

/**
 * Initialize a subscription payment
 */
export async function initializeSubscriptionPayment(
  email: string,
  tier: SubscriptionTier,
  userId: string
) {
  const plan = SUBSCRIPTION_PLANS[tier]

  const response = await paystackClient.initializeTransaction({
    email,
    amount: plan.price,
    reference: `sub_${userId}_${Date.now()}`,
    metadata: {
      user_id: userId,
      tier,
      plan_name: plan.name,
    },
  })

  return response
}

/**
 * Verify subscription payment and activate subscription
 */
export async function verifySubscriptionPayment(reference: string) {
  const response = await paystackClient.verifyTransaction(reference)

  if (response.status && response.data.status === 'success') {
    return {
      success: true,
      reference: response.data.reference,
      amount: response.data.amount,
      metadata: response.data.metadata,
    }
  }

  return {
    success: false,
    reference,
    message: response.message || 'Payment verification failed',
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionCode: string, token: string) {
  const response = await paystackClient.cancelSubscription(subscriptionCode, token)
  return response
}

/**
 * Get subscription tier from price
 */
export function getTierFromPrice(price: number): SubscriptionTier | null {
  for (const [tier, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (plan.price === price) {
      return tier as SubscriptionTier
    }
  }
  return null
}
