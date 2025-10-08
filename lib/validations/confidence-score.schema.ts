/**
 * Confidence Score Validation Schema
 * 
 * Zod schema for confidence_scores table
 */

import { z } from "zod";

export const confidenceScoreSchema = z.object({
  id: z.string().uuid(),
  business_profile_id: z.string().uuid(),
  user_id: z.string().uuid(),

  // Scoring Metrics
  total_posts_generated: z.number().int().min(0).default(0),
  posts_approved_no_edit: z.number().int().min(0).default(0),
  posts_with_minor_edits: z.number().int().min(0).default(0),
  posts_with_major_edits: z.number().int().min(0).default(0),
  posts_rejected: z.number().int().min(0).default(0),

  // Calculated Score (auto-calculated by trigger)
  confidence_score: z.number().min(0).max(100).default(0),

  // Thresholds
  automation_threshold: z.number().min(0).max(100).default(80),
  automation_suggested_at: z.date().nullable(),
  automation_accepted_at: z.date().nullable(),

  // Timestamps
  created_at: z.date(),
  updated_at: z.date(),
});

export const updateConfidenceScoreSchema = confidenceScoreSchema
  .pick({
    total_posts_generated: true,
    posts_approved_no_edit: true,
    posts_with_minor_edits: true,
    posts_with_major_edits: true,
    posts_rejected: true,
  })
  .partial();

export const acceptAutomationSchema = z.object({
  business_profile_id: z.string().uuid(),
  accepted: z.boolean(),
});

export type ConfidenceScore = z.infer<typeof confidenceScoreSchema>;
export type UpdateConfidenceScoreInput = z.infer<typeof updateConfidenceScoreSchema>;
export type AcceptAutomationInput = z.infer<typeof acceptAutomationSchema>;
