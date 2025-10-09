'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BusinessInfoForm } from '@/components/onboarding/business-info-form';
import { toast } from 'sonner';
import type { CreateBusinessProfileInput } from '@/lib/validations/business-profile.schema';

const STORAGE_KEY = 'onboarding_business_info';

export default function BusinessInfoPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [initialData, setInitialData] = useState<Partial<CreateBusinessProfileInput>>({});

    // Load saved data from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setInitialData(JSON.parse(saved));
                toast.info('Draft restored from previous session');
            } catch (error) {
                console.error('Failed to parse saved data:', error);
            }
        }
    }, []);

    const handleSubmit = async (data: Partial<CreateBusinessProfileInput>) => {
        setIsLoading(true);

        try {
            // Save to localStorage for persistence
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

            // Create business profile via API
            const response = await fetch('/api/business-profiles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to create business profile');
            }

            const result = await response.json();
            toast.success('Business profile created successfully!');

            // Clear saved draft
            localStorage.removeItem(STORAGE_KEY);

            // Navigate to next step
            router.push('/onboarding/brand-identity');
        } catch (error) {
            console.error('Error creating business profile:', error);
            toast.error(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        router.push('/onboarding');
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Tell Us About Your Business
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    This information helps our AI generate content that truly represents your brand.
                </p>
            </div>

            <BusinessInfoForm
                initialData={initialData}
                onSubmit={handleSubmit}
                onBack={handleBack}
                isLoading={isLoading}
            />
        </div>
    );
}
