'use client';

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { SA_LANGUAGES, type SALanguage } from '@/lib/constants';
import type { CreateBusinessProfileInput } from '@/lib/validations/business-profile.schema';

const INDUSTRIES = [
    'Retail',
    'Food & Beverage',
    'Healthcare',
    'Professional Services',
    'Home Services',
    'Beauty & Wellness',
    'Technology',
    'Education',
    'Real Estate',
    'Other',
];

const CONTENT_TONES = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'formal', label: 'Formal' },
    { value: 'humorous', label: 'Humorous' },
    { value: 'inspirational', label: 'Inspirational' },
];

interface BusinessInfoFormProps {
    initialData?: Partial<CreateBusinessProfileInput>;
    onSubmit: (data: Partial<CreateBusinessProfileInput>) => void;
    onBack?: () => void;
    isLoading?: boolean;
}

export function BusinessInfoForm({
    initialData,
    onSubmit,
    onBack,
    isLoading = false,
}: BusinessInfoFormProps) {
    const [formData, setFormData] = useState<Partial<CreateBusinessProfileInput>>({
        business_name: initialData?.business_name || '',
        industry: initialData?.industry || '',
        description: initialData?.description || '',
        target_audience: initialData?.target_audience || '',
        services: initialData?.services || [],
        service_areas: initialData?.service_areas || [],
        preferred_languages: initialData?.preferred_languages || ['English'],
        content_tone: initialData?.content_tone,
        brand_colors: initialData?.brand_colors || [],
        brand_keywords: initialData?.brand_keywords || [],
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [currentKeyword, setCurrentKeyword] = useState('');
    const [currentColor, setCurrentColor] = useState('#6B46C1');

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.business_name || formData.business_name.trim().length < 2) {
            newErrors.business_name = 'Business name must be at least 2 characters';
        }

        if (!formData.industry || formData.industry.trim().length === 0) {
            newErrors.industry = 'Please select an industry';
        }

        if (!formData.description || formData.description.trim().length < 10) {
            newErrors.description = 'Description must be at least 10 characters';
        }

        if (!formData.target_audience || formData.target_audience.trim().length < 5) {
            newErrors.target_audience = 'Target audience must be at least 5 characters';
        }

        if (formData.preferred_languages && formData.preferred_languages.length === 0) {
            newErrors.preferred_languages = 'Select at least one language';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    const handleChange = (field: keyof CreateBusinessProfileInput, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const addKeyword = () => {
        if (currentKeyword.trim() && formData.brand_keywords && formData.brand_keywords.length < 10) {
            handleChange('brand_keywords', [...formData.brand_keywords, currentKeyword.trim()]);
            setCurrentKeyword('');
        }
    };

    const removeKeyword = (index: number) => {
        if (formData.brand_keywords) {
            handleChange(
                'brand_keywords',
                formData.brand_keywords.filter((_, i) => i !== index)
            );
        }
    };

    const addColor = () => {
        if (currentColor && formData.brand_colors && formData.brand_colors.length < 5) {
            if (!formData.brand_colors.includes(currentColor)) {
                handleChange('brand_colors', [...formData.brand_colors, currentColor]);
            }
        }
    };

    const removeColor = (index: number) => {
        if (formData.brand_colors) {
            handleChange(
                'brand_colors',
                formData.brand_colors.filter((_, i) => i !== index)
            );
        }
    };

    const toggleLanguage = (langCode: SALanguage) => {
        const currentLangs = formData.preferred_languages || [];
        if (currentLangs.includes(langCode)) {
            handleChange(
                'preferred_languages',
                currentLangs.filter((l) => l !== langCode)
            );
        } else {
            handleChange('preferred_languages', [...currentLangs, langCode]);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div className="space-y-2">
                <Label htmlFor="business_name" className="required">
                    Business Name
                </Label>
                <Input
                    id="business_name"
                    value={formData.business_name || ''}
                    onChange={(e) => handleChange('business_name', e.target.value)}
                    placeholder="Enter your business name"
                    disabled={isLoading}
                />
                {errors.business_name && (
                    <p className="text-sm text-red-500">{errors.business_name}</p>
                )}
            </div>

            {/* Industry */}
            <div className="space-y-2">
                <Label htmlFor="industry" className="required">
                    Industry
                </Label>
                <Select
                    value={formData.industry || ''}
                    onValueChange={(value) => handleChange('industry', value)}
                    disabled={isLoading}
                >
                    <SelectTrigger id="industry">
                        <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                        {INDUSTRIES.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                                {industry}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.industry && <p className="text-sm text-red-500">{errors.industry}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description" className="required">
                    Business Description
                </Label>
                <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe what your business does and what makes it unique"
                    rows={4}
                    disabled={isLoading}
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
                <Label htmlFor="target_audience" className="required">
                    Target Audience
                </Label>
                <Input
                    id="target_audience"
                    value={formData.target_audience || ''}
                    onChange={(e) => handleChange('target_audience', e.target.value)}
                    placeholder="Who are your ideal customers?"
                    disabled={isLoading}
                />
                {errors.target_audience && (
                    <p className="text-sm text-red-500">{errors.target_audience}</p>
                )}
            </div>

            {/* Services */}
            <div className="space-y-2">
                <Label htmlFor="services" className="required">
                    Services/Products
                </Label>
                <Textarea
                    id="services"
                    value={formData.services?.join('\n') || ''}
                    onChange={(e) =>
                        handleChange(
                            'services',
                            e.target.value.split('\n').filter((s) => s.trim())
                        )
                    }
                    placeholder="List your main services or products (one per line)"
                    rows={3}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    Enter one service per line (at least 1 required)
                </p>
            </div>

            {/* Service Areas */}
            <div className="space-y-2">
                <Label htmlFor="service_areas">Service Areas</Label>
                <Input
                    id="service_areas"
                    value={formData.service_areas?.join(', ') || ''}
                    onChange={(e) =>
                        handleChange(
                            'service_areas',
                            e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                        )
                    }
                    placeholder="e.g., Cape Town, Johannesburg, Durban"
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">Separate areas with commas</p>
            </div>

            {/* Preferred Languages */}
            <div className="space-y-2">
                <Label className="required">Preferred Languages</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                    {SA_LANGUAGES.map((lang) => (
                        <Badge
                            key={lang}
                            variant={formData.preferred_languages?.includes(lang) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => !isLoading && toggleLanguage(lang)}
                        >
                            {lang}
                        </Badge>
                    ))}
                </div>
                {errors.preferred_languages && (
                    <p className="text-sm text-red-500">{errors.preferred_languages}</p>
                )}
            </div>

            {/* Content Tone */}
            <div className="space-y-2">
                <Label htmlFor="content_tone">Content Tone</Label>
                <Select
                    value={formData.content_tone || ''}
                    onValueChange={(value) => handleChange('content_tone', value)}
                    disabled={isLoading}
                >
                    <SelectTrigger id="content_tone">
                        <SelectValue placeholder="Select a tone for your content" />
                    </SelectTrigger>
                    <SelectContent>
                        {CONTENT_TONES.map((tone) => (
                            <SelectItem key={tone.value} value={tone.value}>
                                {tone.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Brand Colors */}
            <div className="space-y-2">
                <Label htmlFor="brand_colors">Brand Colors (up to 5)</Label>
                <div className="flex gap-2">
                    <Input
                        type="color"
                        value={currentColor}
                        onChange={(e) => setCurrentColor(e.target.value)}
                        className="w-20 h-10"
                        disabled={isLoading}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={addColor}
                        disabled={isLoading || (formData.brand_colors?.length || 0) >= 5}
                    >
                        Add Color
                    </Button>
                </div>
                {formData.brand_colors && formData.brand_colors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {formData.brand_colors.map((color, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-1 px-2 py-1 border rounded-md"
                            >
                                <div
                                    className="w-6 h-6 rounded border"
                                    style={{ backgroundColor: color } as React.CSSProperties}
                                />
                                <span className="text-sm">{color}</span>
                                <button
                                    type="button"
                                    onClick={() => removeColor(index)}
                                    disabled={isLoading}
                                    className="ml-1 text-gray-500 hover:text-red-500"
                                    aria-label={`Remove color ${color}`}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Brand Keywords */}
            <div className="space-y-2">
                <Label htmlFor="brand_keywords">Brand Keywords (up to 10)</Label>
                <div className="flex gap-2">
                    <Input
                        id="brand_keywords"
                        value={currentKeyword}
                        onChange={(e) => setCurrentKeyword(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addKeyword();
                            }
                        }}
                        placeholder="Add a keyword and press Enter"
                        disabled={isLoading}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={addKeyword}
                        disabled={isLoading || (formData.brand_keywords?.length || 0) >= 10}
                    >
                        Add
                    </Button>
                </div>
                {formData.brand_keywords && formData.brand_keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {formData.brand_keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="gap-1">
                                {keyword}
                                <button
                                    type="button"
                                    onClick={() => removeKeyword(index)}
                                    disabled={isLoading}
                                    className="ml-1 hover:text-red-500"
                                    aria-label={`Remove keyword ${keyword}`}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-between pt-4">
                {onBack && (
                    <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
                        Back
                    </Button>
                )}
                <Button type="submit" disabled={isLoading} className="ml-auto">
                    {isLoading ? 'Saving...' : 'Continue'}
                </Button>
            </div>
        </form>
    );
}
