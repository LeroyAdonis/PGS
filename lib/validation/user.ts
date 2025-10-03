import { z } from 'zod'
import { emailSchema, passwordSchema } from './common'

/**
 * User validation schemas for authentication and profile management
 */

// User registration
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z
    .string()
    .min(2, { message: 'Display name must be at least 2 characters' })
    .max(100, { message: 'Display name must not exceed 100 characters' }),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, { message: 'You must accept the terms and conditions' }),
})

export type RegisterInput = z.infer<typeof registerSchema>

// User login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Password is required' }),
  rememberMe: z.boolean().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>

// Password reset request
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
})

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>

// Password reset confirmation
export const passwordResetConfirmSchema = z
  .object({
    token: z.string().min(1, { message: 'Reset token is required' }),
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: 'Password confirmation is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>

// Update user profile
export const updateUserProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: 'Display name must be at least 2 characters' })
    .max(100, { message: 'Display name must not exceed 100 characters' })
    .optional(),
  avatarUrl: z.string().url({ message: 'Invalid URL' }).optional(),
})

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>

// Change password
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'Current password is required' }),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, { message: 'Password confirmation is required' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
