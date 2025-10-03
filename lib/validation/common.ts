import { z } from 'zod'

/**
 * Common validation schemas used across the application
 */

// UUID validation
export const uuidSchema = z.string().uuid({ message: 'Invalid UUID format' })

// Email validation
export const emailSchema = z.string().email({ message: 'Invalid email address' })

// Password validation (8+ chars, mixed case, numbers, symbols)
export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' })
  .regex(/[^a-zA-Z0-9]/, { message: 'Password must contain at least one special character' })

// Pagination parameters
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// Date range filtering
export const dateRangeSchema = z.object({
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
})

// Supported languages (11 South African languages)
export const languageSchema = z.enum([
  'en', // English
  'af', // Afrikaans
  'zu', // Zulu
  'xh', // Xhosa
  'nso', // Northern Sotho
  'st', // Southern Sotho
  'ss', // Swazi
  'ts', // Tsonga
  'tn', // Tswana
  've', // Venda
  'nr', // Ndebele
])

// Social media platforms
export const platformSchema = z.enum(['facebook', 'instagram', 'twitter', 'linkedin'])

// Content tone options
export const toneSchema = z.enum(['professional', 'casual', 'friendly', 'formal', 'humorous'])

// Subscription tiers
export const subscriptionTierSchema = z.enum(['starter', 'growth', 'enterprise'])

// Post status
export const postStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'scheduled',
  'published',
  'failed',
])

// Social account connection status
export const connectionStatusSchema = z.enum(['connected', 'expired', 'revoked', 'failed'])
