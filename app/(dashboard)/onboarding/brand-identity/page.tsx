'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUpload } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';

interface BrandAsset {
    file: File;
    assetType: 'logo' | 'banner' | 'pattern' | 'other';
    isPrimary: boolean;
}

export default function BrandIdentityPage() {
    const router = useRouter();
    const [assets, setAssets] = useState<BrandAsset[]>([]);
    const [currentAssetType, setCurrentAssetType] = useState<
        'logo' | 'banner' | 'pattern' | 'other'
    >('logo');
    const [isUploading, setIsUploading] = useState(false);

    const handleFilesSelected = (files: File[]) => {
        const newAssets = files.map((file) => ({
            file,
            assetType: currentAssetType,
            isPrimary: assets.length === 0 && currentAssetType === 'logo', // First logo is primary
        }));
        setAssets([...assets, ...newAssets]);
    };

    const handleFileRemove = (index: number) => {
        setAssets(assets.filter((_, i) => i !== index));
    };

    const handleUploadAll = async () => {
        if (assets.length === 0) {
            toast.error('Please select at least one file to upload');
            return;
        }

        setIsUploading(true);

        try {
            // Upload each asset
            const uploadPromises = assets.map(async (asset) => {
                const formData = new FormData();
                formData.append('file', asset.file);
                formData.append('asset_type', asset.assetType);
                formData.append('is_primary', asset.isPrimary.toString());

                const response = await fetch('/api/brand-assets', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || `Failed to upload ${asset.file.name}`);
                }

                return response.json();
            });

            await Promise.all(uploadPromises);
            toast.success(`Successfully uploaded ${assets.length} brand asset(s)!`);

            // Navigate to next step
            router.push('/onboarding/social-connect');
        } catch (error) {
            console.error('Error uploading brand assets:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to upload assets');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSkip = () => {
        router.push('/onboarding/social-connect');
    };

    const handleBack = () => {
        router.push('/onboarding/business-info');
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Upload Your Brand Assets
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Add your logo, banners, and other visual elements to personalize your content. You can
                    always add more later.
                </p>
            </div>

            {/* Asset Type Selector */}
            <div className="space-y-2">
                <Label htmlFor="asset-type">Asset Type</Label>
                <Select
                    value={currentAssetType}
                    onValueChange={(value: any) => setCurrentAssetType(value)}
                    disabled={isUploading}
                >
                    <SelectTrigger id="asset-type">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="logo">Logo</SelectItem>
                        <SelectItem value="banner">Banner</SelectItem>
                        <SelectItem value="pattern">Pattern/Background</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    Select the type of asset you want to upload, then choose files below
                </p>
            </div>

            {/* File Upload */}
            <FileUpload
                multiple
                onFilesSelected={handleFilesSelected}
                onFileRemove={handleFileRemove}
                files={assets.map((a) => a.file)}
                disabled={isUploading}
            />

            {/* Upload Summary */}
            {assets.length > 0 && (
                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Ready to Upload
                    </h3>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <li>
                            • {assets.filter((a) => a.assetType === 'logo').length} logo(s)
                        </li>
                        <li>
                            • {assets.filter((a) => a.assetType === 'banner').length} banner(s)
                        </li>
                        <li>
                            • {assets.filter((a) => a.assetType === 'pattern').length} pattern(s)
                        </li>
                        <li>
                            • {assets.filter((a) => a.assetType === 'other').length} other asset(s)
                        </li>
                    </ul>
                </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-between pt-4 gap-3">
                <Button type="button" variant="outline" onClick={handleBack} disabled={isUploading}>
                    Back
                </Button>

                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleSkip}
                        disabled={isUploading}
                    >
                        Skip for Now
                    </Button>

                    <Button
                        onClick={handleUploadAll}
                        disabled={assets.length === 0 || isUploading}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload & Continue
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Tips */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">💡 Tips</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Upload high-quality images for the best results</li>
                    <li>• Your first logo will be set as the primary logo</li>
                    <li>• Supported formats: JPG, PNG, WebP, SVG (max 10MB)</li>
                    <li>• You can manage and add more assets from your dashboard later</li>
                </ul>
            </div>
        </div>
    );
}
