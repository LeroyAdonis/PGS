import { z } from 'zod'
import { uuidSchema, languageSchema, platformSchema, postStatusSchema } from './common'

/**
 * Post validation schemas for content creation and management
 */

// Create post (AI generation)
export const createPostSchema = z.object({
  businessProfileId: uuidSchema,
  topic: z
    .string()
    .min(3, { message: 'Topic must be at least 3 characters' })
    .max(200, { message: 'Topic must not exceed 200 characters' })
    .optional(),
  language: languageSchema.optional(), // Optional override, defaults to business profile language
  platforms: z
    .array(platformSchema)
    .min(1, { message: 'At least one platform is required' })
    .max(4, { message: 'Maximum 4 platforms allowed' }),
  generateImage: z.boolean().default(true),
  imagePrompt: z
    .string()
    .min(10, { message: 'Image prompt must be at least 10 characters' })
    .max(500, { message: 'Image prompt must not exceed 500 characters' })
    .optional(),
})

export type CreatePostInput = z.infer<typeof createPostSchema>

// Update post
export const updatePostSchema = z.object({
  caption: z
    .string()
    .min(10, { message: 'Caption must be at least 10 characters' })
    .max(3000, { message: 'Caption must not exceed 3000 characters' })
    .optional(),
  hashtags: z
    .array(z.string().regex(/^[a-zA-Z0-9_]+$/, { message: 'Invalid hashtag format' }))
    .min(0)
    .max(30, { message: 'Maximum 30 hashtags allowed' })
    .optional(),
  platforms: z
    .array(platformSchema)
    .min(1, { message: 'At least one platform is required' })
    .max(4, { message: 'Maximum 4 platforms allowed' })
    .optional(),
  imageUrl: z.string().url({ message: 'Invalid image URL' }).optional(),
})

export type UpdatePostInput = z.infer<typeof updatePostSchema>

// Schedule post
export const schedulePostSchema = z
  .object({
    scheduledTime: z.string().datetime({ message: 'Invalid datetime format' }),
  })
  .refine(
    (data) => {
      const scheduledTime = new Date(data.scheduledTime)
      const now = new Date()
      const minTime = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes from now
      return scheduledTime >= minTime
    },
    {
      message: 'Scheduled time must be at least 5 minutes in the future',
      path: ['scheduledTime'],
    }
  )

export type SchedulePostInput = z.infer<typeof schedulePostSchema>

// Regenerate image
export const regenerateImageSchema = z.object({
  imagePrompt: z
    .string()
    .min(10, { message: 'Image prompt must be at least 10 characters' })
    .max(500, { message: 'Image prompt must not exceed 500 characters' })
    .optional(),
})

export type RegenerateImageInput = z.infer<typeof regenerateImageSchema>

// List posts filters
export const listPostsFiltersSchema = z.object({
  status: postStatusSchema.optional(),
  platform: platformSchema.optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type ListPostsFiltersInput = z.infer<typeof listPostsFiltersSchema>
