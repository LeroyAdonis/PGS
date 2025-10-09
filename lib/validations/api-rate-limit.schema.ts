/**
 * API Rate Limit Validation Schema
 * 
 * Zod schema for api_rate_limits table
 */

import { z } from "zod";
import { SOCIAL_PLATFORMS } from "@/lib/constants";

export const rateLimitPlatforms = [...SOCIAL_PLATFORMS, "gemini"] as const;

export const apiRateLimitSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),

  // Platform & Type
  platform: z.enum(rateLimitPlatforms),
  limit_type: z.string().max(50),

  // Rate Limiting
  calls_made: z.number().int().min(0).default(0),
  calls_limit: z.number().int().positive(),
  window_duration: z.string(), // PostgreSQL interval type as string

  // Window Management
  window_start: z.date(),
  resets_at: z.date(),

  // Timestamps
  created_at: z.date(),
  updated_at: z.date(),
});

export const createApiRateLimitSchema = apiRateLimitSchema.omit({
  id: true,
  calls_made: true,
  created_at: true,
  updated_at: true,
});

export const incrementRateLimitSchema = z.object({
  user_id: z.string().uuid(),
  platform: z.enum(rateLimitPlatforms),
  limit_type: z.string().max(50),
});

export const checkRateLimitSchema = z.object({
  user_id: z.string().uuid(),
  platform: z.enum(rateLimitPlatforms),
  limit_type: z.string().max(50),
});

export type ApiRateLimit = z.infer<typeof apiRateLimitSchema>;
export type CreateApiRateLimitInput = z.infer<typeof createApiRateLimitSchema>;
export type IncrementRateLimitInput = z.infer<typeof incrementRateLimitSchema>;
export type CheckRateLimitInput = z.infer<typeof checkRateLimitSchema>;
