/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { handleApiError, AppError } from '@/lib/api/error-handler';
import { successResponse } from '@/lib/api/response';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const supabase = await createClient();

    // Sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AppError('Invalid email or password', 401, 'LOGIN_FAILED');
    }

    if (!data.user || !data.session) {
      throw new AppError('Login failed', 401, 'LOGIN_FAILED');
    }

    return successResponse({
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'user',
        created_at: data.user.created_at,
        last_sign_in_at: data.user.last_sign_in_at,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
