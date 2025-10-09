/**
 * User Validation Schema
 * 
 * Zod schema for users table
 */

import { z } from "zod";
import { USER_ROLES, type UserRole } from "@/lib/constants";

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().max(255),
  created_at: z.date(),
  updated_at: z.date(),
  last_sign_in_at: z.date().nullable(),
  email_confirmed_at: z.date().nullable(),
  role: z.enum(USER_ROLES),
  metadata: z.record(z.any()).default({}),
});

export const createUserSchema = userSchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })
  .extend({
    password: z.string().min(8, "Password must be at least 8 characters"),
  });

export const updateUserSchema = userSchema.partial().omit({
  id: true,
  created_at: true,
  email: true, // Email cannot be updated directly
});

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
