/**
 * Business Profile Validation Schema
 * 
 * Zod schema for business_profiles table
 */

import { z } from "zod";
import { SA_LANGUAGES, CONTENT_TONES, type SALanguage, type ContentTone } from "@/lib/constants";

export const businessProfileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),

  // Basic Information
  business_name: z.string().min(2, "Business name must be at least 2 characters").max(100),
  industry: z.string().min(2, "Industry must be at least 2 characters").max(50),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(500, "Description cannot exceed 500 characters"),

  // Target Audience
  target_audience: z
    .string()
    .min(20, "Target audience must be at least 20 characters")
    .max(300),
  target_demographics: z.array(z.string()).default([]),

  // Services & Areas
  services: z
    .array(z.string())
    .min(1, "At least one service is required")
    .max(20, "Maximum 20 services allowed"),
  service_areas: z.array(z.string()).default([]),

  // Content Preferences
  preferred_languages: z
    .array(z.enum(SA_LANGUAGES))
    .min(1, "At least one language is required")
    .default(["English"]),
  content_tone: z.enum(CONTENT_TONES),

  // Brand Identity
  brand_colors: z
    .array(
      z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format (e.g., #8B5CF6)")
    )
    .max(10, "Maximum 10 brand colors")
    .default([]),
  brand_keywords: z.array(z.string()).max(20, "Maximum 20 keywords").default([]),

  // AI Learning State
  confidence_score: z.number().min(0).max(100).default(0),
  automation_enabled: z.boolean().default(false),

  // Timestamps
  created_at: z.date(),
  updated_at: z.date(),
});

export const createBusinessProfileSchema = businessProfileSchema.omit({
  id: true,
  user_id: true,
  confidence_score: true,
  automation_enabled: true,
  created_at: true,
  updated_at: true,
});

export const updateBusinessProfileSchema = businessProfileSchema
  .omit({
    id: true,
    user_id: true,
    created_at: true,
    updated_at: true,
  })
  .partial();

export type BusinessProfile = z.infer<typeof businessProfileSchema>;
export type CreateBusinessProfileInput = z.infer<typeof createBusinessProfileSchema>;
export type UpdateBusinessProfileInput = z.infer<typeof updateBusinessProfileSchema>;
