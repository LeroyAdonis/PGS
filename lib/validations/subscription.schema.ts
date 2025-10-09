/**
 * Subscription Validation Schema
 * 
 * Zod schema for subscriptions table
 */

import { z } from "zod";
import {
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_STATUSES,
  type SubscriptionTier,
  type SubscriptionStatus,
} from "@/lib/constants";

export const subscriptionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),

  // Subscription Details
  tier: z.enum(SUBSCRIPTION_TIERS),
  status: z.enum(SUBSCRIPTION_STATUSES),

  // Billing
  paystack_customer_id: z.string().nullable(),
  paystack_subscription_id: z.string().nullable(),
  amount_zar: z.number().min(0).default(0),

  // Limits & Usage
  monthly_post_limit: z.number().int().default(50),
  posts_used_this_cycle: z.number().int().min(0).default(0),

  // Billing Cycle
  current_period_start: z.date(),
  current_period_end: z.date(),
  trial_ends_at: z.date().nullable(),

  // Timestamps
  created_at: z.date(),
  updated_at: z.date(),
  canceled_at: z.date().nullable(),
});

export const updateSubscriptionSchema = subscriptionSchema
  .pick({
    tier: true,
    status: true,
    paystack_customer_id: true,
    paystack_subscription_id: true,
  })
  .partial();

export const subscriptionUsageSchema = subscriptionSchema.pick({
  monthly_post_limit: true,
  posts_used_this_cycle: true,
  current_period_start: true,
  current_period_end: true,
});

export type Subscription = z.infer<typeof subscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type SubscriptionUsage = z.infer<typeof subscriptionUsageSchema>;
