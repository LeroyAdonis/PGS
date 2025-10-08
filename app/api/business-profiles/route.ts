/**
 * Business Profiles API Routes
 * 
 * GET /api/business-profiles - Get current user's business profile
 * POST /api/business-profiles - Create business profile
 * PATCH /api/business-profiles - Update business profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  createBusinessProfile, 
  getBusinessProfile, 
  updateBusinessProfile 
} from '@/lib/services/business-profile';
import { 
  createBusinessProfileSchema, 
  updateBusinessProfileSchema 
} from '@/lib/validations/business-profile.schema';
import { handleApiError, AuthError, ConflictError, NotFoundError } from '@/lib/api/error-handler';
import { successResponse } from '@/lib/api/response';

/**
 * GET /api/business-profiles
 * Get the authenticated user's business profile
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new AuthError();
    }

    const profile = await getBusinessProfile(user.id);

    if (!profile) {
      throw new NotFoundError('Business profile');
    }

    return successResponse(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/business-profiles
 * Create a new business profile (onboarding)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new AuthError();
    }

    // Check if profile already exists
    const existingProfile = await getBusinessProfile(user.id);
    if (existingProfile) {
      throw new ConflictError('Business profile already exists for this user');
    }

    const body = await request.json();
    const validatedData = createBusinessProfileSchema.parse(body);

    const profile = await createBusinessProfile(user.id, validatedData);

    return successResponse(profile, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/business-profiles
 * Update the authenticated user's business profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new AuthError();
    }

    const body = await request.json();
    const validatedData = updateBusinessProfileSchema.parse(body);

    const profile = await updateBusinessProfile(user.id, validatedData);

    return successResponse(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
