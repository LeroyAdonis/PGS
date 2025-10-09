/**
 * Post Image Validation Schema
 * 
 * Zod schema for post_images table
 */

import { z } from "zod";

export const postImageSchema = z.object({
  id: z.string().uuid(),
  post_id: z.string().uuid(),
  user_id: z.string().uuid(),

  // Image Storage
  storage_path: z.string(),
  public_url: z.string().url(),

  // Image Metadata
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  file_size: z
    .number()
    .int()
    .positive()
    .max(10485760, "File size cannot exceed 10MB")
    .nullable(),
  mime_type: z.enum(["image/jpeg", "image/png", "image/webp"]).default("image/jpeg"),

  // AI Generation
  generated_by: z.string().nullable(),
  generation_prompt: z.string().nullable(),

  // Timestamp
  created_at: z.date(),
});

export const createPostImageSchema = postImageSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
});

export const uploadImageSchema = z.object({
  file: z.instanceof(File).refine((file) => file.size <= 10485760, {
    message: "File size cannot exceed 10MB",
  }),
  post_id: z.string().uuid(),
});

export const generateImageSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters").max(500),
  post_id: z.string().uuid().optional(),
  aspect_ratio: z.enum(["1:1", "4:5", "16:9"]).default("1:1"),
});

export type PostImage = z.infer<typeof postImageSchema>;
export type CreatePostImageInput = z.infer<typeof createPostImageSchema>;
export type UploadImageInput = z.infer<typeof uploadImageSchema>;
export type GenerateImageInput = z.infer<typeof generateImageSchema>;
