/**
 * Brand Assets Service
 * Handles upload, storage, and management of brand assets (logos, banners, etc.)
 */

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';

type BrandAsset = Database['public']['Tables']['brand_assets']['Row'];
type BrandAssetInsert = Database['public']['Tables']['brand_assets']['Insert'];

const STORAGE_BUCKET = 'brand-assets';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];

/**
 * Upload a brand asset file to Supabase Storage
 */
export async function uploadBrandAsset(
  userId: string,
  businessProfileId: string,
  file: File,
  assetType: 'logo' | 'banner' | 'pattern' | 'other',
  isPrimary = false
): Promise<BrandAsset> {
  const supabase = await createClient();

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  // Generate unique file path
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const storagePath = `${STORAGE_BUCKET}/${fileName}`;

  // Upload file to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);

  // If this is a primary logo, unset any existing primary logos
  if (isPrimary && assetType === 'logo') {
    await supabase
      .from('brand_assets')
      .update({ is_primary: false })
      .eq('business_profile_id', businessProfileId)
      .eq('asset_type', 'logo');
  }

  // Create database record
  const assetData: BrandAssetInsert = {
    user_id: userId,
    business_profile_id: businessProfileId,
    asset_type: assetType,
    storage_path: storagePath,
    public_url: publicUrl,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
    is_primary: isPrimary,
  };

  const { data: asset, error: dbError } = await supabase
    .from('brand_assets')
    .insert(assetData)
    .select()
    .single();

  if (dbError) {
    // Cleanup: delete uploaded file if database insert fails
    await supabase.storage.from(STORAGE_BUCKET).remove([fileName]);
    throw new Error(`Failed to create asset record: ${dbError.message}`);
  }

  return asset;
}

/**
 * List brand assets for a business profile
 */
export async function listBrandAssets(
  businessProfileId: string,
  assetType?: 'logo' | 'banner' | 'pattern' | 'other'
): Promise<BrandAsset[]> {
  const supabase = await createClient();

  let query = supabase
    .from('brand_assets')
    .select('*')
    .eq('business_profile_id', businessProfileId)
    .order('created_at', { ascending: false });

  if (assetType) {
    query = query.eq('asset_type', assetType);
  }

  const { data: assets, error } = await query;

  if (error) {
    throw new Error(`Failed to list brand assets: ${error.message}`);
  }

  return assets || [];
}

/**
 * Get a single brand asset by ID
 */
export async function getBrandAsset(assetId: string): Promise<BrandAsset | null> {
  const supabase = await createClient();

  const { data: asset, error } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('id', assetId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get brand asset: ${error.message}`);
  }

  return asset;
}

/**
 * Delete a brand asset
 */
export async function deleteBrandAsset(assetId: string, userId: string): Promise<void> {
  const supabase = await createClient();

  // Get asset details first
  const asset = await getBrandAsset(assetId);
  
  if (!asset) {
    throw new Error('Brand asset not found');
  }

  // Verify ownership
  if (asset.user_id !== userId) {
    throw new Error('Unauthorized to delete this asset');
  }

  // Delete from storage
  const fileName = asset.storage_path.replace(`${STORAGE_BUCKET}/`, '');
  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([fileName]);

  if (storageError) {
    console.error('Failed to delete file from storage:', storageError);
    // Continue anyway, as DB record should be deleted
  }

  // Delete database record
  const { error: dbError } = await supabase
    .from('brand_assets')
    .delete()
    .eq('id', assetId);

  if (dbError) {
    throw new Error(`Failed to delete brand asset: ${dbError.message}`);
  }
}

/**
 * Update brand asset metadata
 */
export async function updateBrandAsset(
  assetId: string,
  userId: string,
  updates: { is_primary?: boolean; asset_type?: 'logo' | 'banner' | 'pattern' | 'other' }
): Promise<BrandAsset> {
  const supabase = await createClient();

  // Get asset first to verify ownership
  const asset = await getBrandAsset(assetId);
  
  if (!asset) {
    throw new Error('Brand asset not found');
  }

  if (asset.user_id !== userId) {
    throw new Error('Unauthorized to update this asset');
  }

  // If setting as primary logo, unset other primary logos
  if (updates.is_primary && (updates.asset_type === 'logo' || asset.asset_type === 'logo')) {
    await supabase
      .from('brand_assets')
      .update({ is_primary: false })
      .eq('business_profile_id', asset.business_profile_id)
      .eq('asset_type', 'logo')
      .neq('id', assetId);
  }

  const { data: updatedAsset, error } = await supabase
    .from('brand_assets')
    .update(updates)
    .eq('id', assetId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update brand asset: ${error.message}`);
  }

  return updatedAsset;
}
