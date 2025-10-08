/**
 * DELETE /api/brand-assets/[assetId]
 * Delete a brand asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteBrandAsset } from '@/lib/services/brand-assets';
import { handleApiError, AuthError } from '@/lib/api/error-handler';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new AuthError();
    }

    await deleteBrandAsset(params.assetId, user.id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
