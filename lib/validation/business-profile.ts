import { z } from 'zod'
import { languageSchema, toneSchema } from './common'

/**
 * Business profile validation schemas
 */

// Create business profile
export const createBusinessProfileSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Business name must be at least 2 characters' })
    .max(200, { message: 'Business name must not exceed 200 characters' }),
  industry: z
    .string()
    .min(2, { message: 'Industry must be at least 2 characters' })
    .max(100, { message: 'Industry must not exceed 100 characters' }),
  targetAudience: z
    .string()
    .min(10, { message: 'Target audience description must be at least 10 characters' })
    .max(500, { message: 'Target audience description must not exceed 500 characters' }),
  tone: toneSchema,
  topics: z
    .array(z.string().min(2).max(100))
    .min(1, { message: 'At least one topic is required' })
    .max(10, { message: 'Maximum 10 topics allowed' }),
  language: languageSchema,
  logoUrl: z
    .string()
    .optional()
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: 'Invalid logo URL',
    }),
})

export type CreateBusinessProfileInput = z.infer<typeof createBusinessProfileSchema>

// Update business profile
export const updateBusinessProfileSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Business name must be at least 2 characters' })
    .max(200, { message: 'Business name must not exceed 200 characters' })
    .optional(),
  industry: z
    .string()
    .min(2, { message: 'Industry must be at least 2 characters' })
    .max(100, { message: 'Industry must not exceed 100 characters' })
    .optional(),
  targetAudience: z
    .string()
    .min(10, { message: 'Target audience description must be at least 10 characters' })
    .max(500, { message: 'Target audience description must not exceed 500 characters' })
    .optional(),
  tone: toneSchema.optional(),
  topics: z
    .array(z.string().min(2).max(100))
    .min(1, { message: 'At least one topic is required' })
    .max(10, { message: 'Maximum 10 topics allowed' })
    .optional(),
  language: languageSchema.optional(),
  logoUrl: z
    .string()
    .optional()
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: 'Invalid logo URL',
    }),
})

export type UpdateBusinessProfileInput = z.infer<typeof updateBusinessProfileSchema>

// Toggle automation
export const toggleAutomationSchema = z.object({
  enabled: z.boolean(),
})

export type ToggleAutomationInput = z.infer<typeof toggleAutomationSchema>
