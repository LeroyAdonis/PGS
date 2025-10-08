/**
 * Subscription Event Validation Schema
 * 
 * Zod schema for subscription_events table (immutable audit log)
 */

import { z } from "zod";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";

export const SUBSCRIPTION_EVENT_TYPES = [
  "created",
  "upgraded",
  "downgraded",
  "canceled",
  "reactivated",
  "payment_succeeded",
  "payment_failed",
  "trial_started",
  "trial_ended",
] as const;

export type SubscriptionEventType = (typeof SUBSCRIPTION_EVENT_TYPES)[number];

export const subscriptionEventSchema = z.object({
  id: z.string().uuid(),
  subscription_id: z.string().uuid(),
  user_id: z.string().uuid(),

  // Event Details
  event_type: z.enum(SUBSCRIPTION_EVENT_TYPES),
  from_tier: z.enum(SUBSCRIPTION_TIERS).nullable(),
  to_tier: z.enum(SUBSCRIPTION_TIERS).nullable(),

  // Payment Integration
  paystack_reference: z.string().max(255).nullable(),
  amount_zar: z.number().min(0).nullable(),

  // Metadata
  metadata: z.record(z.any()).nullable(),

  // Timestamp (immutable)
  created_at: z.date(),
});

// No update schema - subscription events are immutable
export const createSubscriptionEventSchema = subscriptionEventSchema
  .omit({
    id: true,
    created_at: true,
  })
  .refine(
    (data) => {
      // For upgrades and downgrades, from_tier and to_tier are required
      if (data.event_type === "upgraded" || data.event_type === "downgraded") {
        return data.from_tier !== null && data.to_tier !== null;
      }
      return true;
    },
    {
      message: "from_tier and to_tier are required for upgrade/downgrade events",
    }
  );

export const subscriptionEventQuerySchema = z.object({
  subscription_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  event_type: z.enum(SUBSCRIPTION_EVENT_TYPES).optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type SubscriptionEvent = z.infer<typeof subscriptionEventSchema>;
export type CreateSubscriptionEventInput = z.infer<typeof createSubscriptionEventSchema>;
export type SubscriptionEventQuery = z.infer<typeof subscriptionEventQuerySchema>;
