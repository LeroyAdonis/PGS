/**
 * POST /api/auth/signup
 * Create a new user account
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { handleApiError, AppError } from '@/lib/api/error-handler';
import { successResponse } from '@/lib/api/response';

const signUpSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = signUpSchema.parse(body);

    const supabase = await createClient();

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
      },
    });

    if (error) {
      throw new AppError(error.message, 400, 'SIGNUP_FAILED');
    }

    if (!data.user) {
      throw new AppError('Failed to create user', 500, 'USER_CREATION_FAILED');
    }

    return successResponse(
      {
        user: {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
        },
        session: data.session
          ? {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_in: data.session.expires_in,
              expires_at: data.session.expires_at,
            }
          : null,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
