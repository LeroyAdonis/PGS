/**
 * Analytics Data Validation Schema
 * 
 * Zod schema for analytics_data table
 */

import { z } from "zod";
import { SOCIAL_PLATFORMS } from "@/lib/constants";

export const analyticsDataSchema = z.object({
  id: z.string().uuid(),
  post_id: z.string().uuid(),
  user_id: z.string().uuid(),

  // Platform
  platform: z.enum(SOCIAL_PLATFORMS),
  platform_post_id: z.string().max(255),

  // Engagement Metrics
  likes_count: z.number().int().min(0).default(0),
  comments_count: z.number().int().min(0).default(0),
  shares_count: z.number().int().min(0).default(0),
  impressions_count: z.number().int().min(0).default(0),
  reach_count: z.number().int().min(0).default(0),
  clicks_count: z.number().int().min(0).default(0),

  // Engagement Rate (auto-calculated)
  engagement_rate: z.number().min(0).max(100).default(0),

  // Sync Information
  synced_at: z.date(),

  // Timestamps
  created_at: z.date(),
  updated_at: z.date(),
});

export const createAnalyticsDataSchema = analyticsDataSchema.omit({
  id: true,
  user_id: true,
  engagement_rate: true,
  created_at: true,
  updated_at: true,
});

export const updateAnalyticsDataSchema = analyticsDataSchema
  .pick({
    likes_count: true,
    comments_count: true,
    shares_count: true,
    impressions_count: true,
    reach_count: true,
    clicks_count: true,
  })
  .partial();

export const analyticsQuerySchema = z.object({
  post_id: z.string().uuid().optional(),
  platform: z.enum(SOCIAL_PLATFORMS).optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().min(0).default(0),
});

export type AnalyticsData = z.infer<typeof analyticsDataSchema>;
export type CreateAnalyticsDataInput = z.infer<typeof createAnalyticsDataSchema>;
export type UpdateAnalyticsDataInput = z.infer<typeof updateAnalyticsDataSchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
