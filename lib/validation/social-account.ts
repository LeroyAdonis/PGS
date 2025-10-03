import { z } from 'zod'
import { uuidSchema, platformSchema, connectionStatusSchema } from './common'

/**
 * Social account validation schemas for OAuth connections
 */

// Connect social account (OAuth initiation)
export const connectSocialAccountSchema = z.object({
  platform: platformSchema,
  businessProfileId: uuidSchema,
  redirectUri: z.string().url({ message: 'Invalid redirect URI' }).optional(),
})

export type ConnectSocialAccountInput = z.infer<typeof connectSocialAccountSchema>

// OAuth callback
export const oauthCallbackSchema = z.object({
  code: z.string().min(1, { message: 'Authorization code is required' }),
  state: z.string().min(1, { message: 'State parameter is required' }),
  platform: platformSchema,
})

export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>

// List social accounts filters
export const listSocialAccountsFiltersSchema = z.object({
  platform: platformSchema.optional(),
  status: connectionStatusSchema.optional(),
})

export type ListSocialAccountsFiltersInput = z.infer<typeof listSocialAccountsFiltersSchema>

// Disconnect social account
export const disconnectSocialAccountSchema = z.object({
  accountId: uuidSchema,
})

export type DisconnectSocialAccountInput = z.infer<typeof disconnectSocialAccountSchema>
