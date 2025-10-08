/**
 * Post Validation Schema
 * 
 * Zod schema for posts table
 */

import { z } from "zod";
import { SA_LANGUAGES, SOCIAL_PLATFORMS, POST_STATUSES } from "@/lib/constants";

export const postSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  business_profile_id: z.string().uuid(),

  // Content
  content_text: z.string().min(10, "Content must be at least 10 characters").max(5000),
  content_language: z.enum(SA_LANGUAGES),

  // AI Generation Metadata
  generated_by: z.string().nullable(),
  generation_prompt: z.string().nullable(),
  original_text: z.string().nullable(),
  edit_count: z.number().int().min(0).default(0),

  // Lifecycle State
  status: z.enum(POST_STATUSES),

  // Scheduling
  scheduled_for: z.date().nullable(),
  published_at: z.date().nullable(),

  // Publishing Details
  target_platforms: z
    .array(z.enum(SOCIAL_PLATFORMS))
    .min(1, "At least one platform is required"),
  published_to: z.record(z.any()).default({}),

  // Error Handling
  failure_reason: z.string().nullable(),
  retry_count: z.number().int().min(0).max(3).default(0),

  // Timestamps
  created_at: z.date(),
  updated_at: z.date(),
});

export const createPostSchema = postSchema
  .omit({
    id: true,
    user_id: true,
    business_profile_id: true,
    edit_count: true,
    status: true,
    published_at: true,
    published_to: true,
    failure_reason: true,
    retry_count: true,
    created_at: true,
    updated_at: true,
  })
  .extend({
    scheduled_for: z.date().optional(),
  });

export const updatePostSchema = postSchema
  .pick({
    content_text: true,
    content_language: true,
    status: true,
    scheduled_for: true,
    target_platforms: true,
  })
  .partial();

export const generatePostInputSchema = z.object({
  topic: z.string().min(5, "Topic must be at least 5 characters").max(200),
  content_language: z.enum(SA_LANGUAGES).default("English"),
  target_platforms: z
    .array(z.enum(SOCIAL_PLATFORMS))
    .min(1, "At least one platform is required"),
  include_image: z.boolean().default(false),
  image_prompt: z.string().optional(),
  scheduled_for: z.date().optional(),
});

export type Post = z.infer<typeof postSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type GeneratePostInput = z.infer<typeof generatePostInputSchema>;
