/**
 * Social Account Validation Schema
 * 
 * Zod schema for social_accounts table
 */

import { z } from "zod";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/constants";

export const socialAccountSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),

  // Platform Information
  platform: z.enum(SOCIAL_PLATFORMS),
  platform_user_id: z.string().max(255),
  platform_username: z.string().max(255).nullable(),

  // OAuth Tokens (never returned to client)
  access_token: z.string(),
  refresh_token: z.string().nullable(),
  token_expires_at: z.date().nullable(),

  // Account Status
  is_active: z.boolean().default(true),
  last_sync_at: z.date().nullable(),

  // Platform-Specific Data
  platform_data: z.record(z.any()).default({}),

  // Timestamps
  created_at: z.date(),
  updated_at: z.date(),
});

export const createSocialAccountSchema = socialAccountSchema.omit({
  id: true,
  user_id: true,
  is_active: true,
  last_sync_at: true,
  created_at: true,
  updated_at: true,
});

export const updateSocialAccountSchema = socialAccountSchema
  .omit({
    id: true,
    user_id: true,
    platform: true,
    platform_user_id: true,
    created_at: true,
    updated_at: true,
  })
  .partial();

// Public-safe schema (excludes sensitive tokens)
export const publicSocialAccountSchema = socialAccountSchema.omit({
  access_token: true,
  refresh_token: true,
});

export type SocialAccount = z.infer<typeof socialAccountSchema>;
export type CreateSocialAccountInput = z.infer<typeof createSocialAccountSchema>;
export type UpdateSocialAccountInput = z.infer<typeof updateSocialAccountSchema>;
export type PublicSocialAccount = z.infer<typeof publicSocialAccountSchema>;
