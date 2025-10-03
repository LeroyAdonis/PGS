/**
 * TypeScript types for Paystack API interactions
 */

export type SubscriptionTier = 'starter' | 'growth' | 'enterprise'

export interface SubscriptionPlan {
  tier: SubscriptionTier
  name: string
  price: number // In cents (kobo for ZAR)
  currency: string
  interval: 'monthly' | 'annually'
  features: {
    postsPerMonth: number
    platforms: number
    teamMembers: number
    storageGB: number
    automation: boolean
    prioritySupport: boolean
    whiteLabeling: boolean
  }
}

export interface PaystackTransaction {
  reference: string
  amount: number
  currency: string
  status: 'success' | 'failed' | 'abandoned'
  customer: {
    email: string
    customer_code: string
  }
  metadata?: Record<string, unknown>
}

export interface PaystackSubscription {
  subscription_code: string
  email_token: string
  amount: number
  cron_expression: string
  next_payment_date: string
  status: 'active' | 'non-renewing' | 'cancelled'
  customer: {
    email: string
    customer_code: string
  }
  plan: {
    plan_code: string
    name: string
  }
}
