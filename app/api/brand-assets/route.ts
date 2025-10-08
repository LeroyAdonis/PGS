/**
 * Brand Assets API Routes
 * 
 * GET /api/brand-assets - List brand assets
 * POST /api/brand-assets - Upload brand asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadBrandAsset, listBrandAssets } from '@/lib/services/brand-assets';
import { getBusinessProfile } from '@/lib/services/business-profile';
import { handleApiError, AuthError, AppError, NotFoundError } from '@/lib/api/error-handler';
import { successResponse } from '@/lib/api/response';
import { z } from 'zod';

const assetTypeSchema = z.enum(['logo', 'banner', 'pattern', 'other']);

/**
 * GET /api/brand-assets
 * List brand assets for the authenticated user's business profile
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new AuthError();
    }

    // Get business profile
    const profile = await getBusinessProfile(user.id);
    if (!profile) {
      throw new NotFoundError('Business profile');
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get('asset_type');

    let assets;
    if (assetType) {
      const validatedType = assetTypeSchema.parse(assetType);
      assets = await listBrandAssets(profile.id, validatedType);
    } else {
      assets = await listBrandAssets(profile.id);
    }

    return successResponse({ data: assets });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/brand-assets
 * Upload a brand asset
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new AuthError();
    }

    // Get business profile
    const profile = await getBusinessProfile(user.id);
    if (!profile) {
      throw new NotFoundError('Business profile');
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const assetType = formData.get('asset_type') as string;
    const isPrimary = formData.get('is_primary') === 'true';

    if (!file) {
      throw new AppError('No file provided', 400, 'MISSING_FILE');
    }

    if (!assetType) {
      throw new AppError('Asset type is required', 400, 'MISSING_ASSET_TYPE');
    }

    const validatedType = assetTypeSchema.parse(assetType);

    const asset = await uploadBrandAsset(
      user.id,
      profile.id,
      file,
      validatedType,
      isPrimary
    );

    return successResponse(asset, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
