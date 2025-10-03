import { z } from 'zod'
import { uuidSchema, subscriptionTierSchema } from './common'

/**
 * Subscription validation schemas for billing and tier management
 */

// Upgrade subscription
export const upgradeSubscriptionSchema = z.object({
  tier: subscriptionTierSchema,
  businessProfileId: uuidSchema,
})

export type UpgradeSubscriptionInput = z.infer<typeof upgradeSubscriptionSchema>

// Cancel subscription
export const cancelSubscriptionSchema = z.object({
  subscriptionId: uuidSchema,
  reason: z
    .string()
    .min(10, { message: 'Cancellation reason must be at least 10 characters' })
    .max(500, { message: 'Cancellation reason must not exceed 500 characters' })
    .optional(),
})

export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>

// Billing history filters
export const billingHistoryFiltersSchema = z.object({
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type BillingHistoryFiltersInput = z.infer<typeof billingHistoryFiltersSchema>

// Subscription status
export const subscriptionStatusSchema = z.enum([
  'trial',
  'active',
  'past_due',
  'cancelled',
  'expired',
])

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>
