/**
 * Brand Asset Validation Schema
 * 
 * Zod schema for brand_assets table
 */

import { z } from "zod";
import { BRAND_ASSET_TYPES, type BrandAssetType } from "@/lib/constants";

export const brandAssetSchema = z.object({
  id: z.string().uuid(),
  business_profile_id: z.string().uuid(),
  user_id: z.string().uuid(),

  // Asset Details
  asset_type: z.enum(BRAND_ASSET_TYPES),
  storage_path: z.string(),
  public_url: z.string().url(),

  // Metadata
  file_name: z.string().max(255),
  file_size: z
    .number()
    .int()
    .positive()
    .max(10485760, "File size cannot exceed 10MB")
    .nullable(),
  mime_type: z.enum(["image/jpeg", "image/png", "image/svg+xml"]).nullable(),

  // Usage
  is_primary: z.boolean().default(false),

  // Timestamps
  created_at: z.date(),
  updated_at: z.date(),
});

export const createBrandAssetSchema = brandAssetSchema.omit({
  id: true,
  user_id: true,
  business_profile_id: true,
  storage_path: true,
  public_url: true,
  created_at: true,
  updated_at: true,
});

export const uploadBrandAssetSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10485760, {
      message: "File size cannot exceed 10MB",
    })
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "image/svg+xml"].includes(file.type),
      {
        message: "File must be JPEG, PNG, or SVG",
      }
    ),
  asset_type: z.enum(BRAND_ASSET_TYPES),
  is_primary: z.boolean().default(false),
});

export const updateBrandAssetSchema = brandAssetSchema
  .pick({
    asset_type: true,
    is_primary: true,
  })
  .partial();

export type BrandAsset = z.infer<typeof brandAssetSchema>;
export type CreateBrandAssetInput = z.infer<typeof createBrandAssetSchema>;
export type UploadBrandAssetInput = z.infer<typeof uploadBrandAssetSchema>;
export type UpdateBrandAssetInput = z.infer<typeof updateBrandAssetSchema>;
