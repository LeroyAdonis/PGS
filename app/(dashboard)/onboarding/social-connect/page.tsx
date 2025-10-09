'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Facebook, Instagram, Twitter, Linkedin, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SocialConnectPage() {
    const router = useRouter();
    const [isCompleting, setIsCompleting] = useState(false);

    const platforms = [
        {
            id: 'facebook',
            name: 'Facebook',
            icon: Facebook,
            color: 'bg-blue-600',
            available: false, // Phase 4
        },
        {
            id: 'instagram',
            name: 'Instagram',
            icon: Instagram,
            color: 'bg-pink-600',
            available: false, // Phase 4
        },
        {
            id: 'twitter',
            name: 'X (Twitter)',
            icon: Twitter,
            color: 'bg-sky-500',
            available: false, // Phase 4
        },
        {
            id: 'linkedin',
            name: 'LinkedIn',
            icon: Linkedin,
            color: 'bg-blue-700',
            available: false, // Phase 4
        },
    ];

    const handleComplete = async () => {
        setIsCompleting(true);

        try {
            // In Phase 4, this will handle OAuth connections
            // For now, just complete onboarding
            await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call

            toast.success('Onboarding complete! Welcome to Purple Glow Social 🎉');
            router.push('/dashboard');
        } catch (error) {
            console.error('Error completing onboarding:', error);
            toast.error('Failed to complete onboarding');
        } finally {
            setIsCompleting(false);
        }
    };

    const handleBack = () => {
        router.push('/onboarding/brand-identity');
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Connect Your Social Media Accounts
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Link your social media accounts to start posting content. You can connect them now or
                    later from your dashboard.
                </p>
            </div>

            {/* Coming Soon Notice */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        Social Media Integration Coming Soon
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Social media account connections will be available in Phase 4. For now, you can complete
                        your onboarding and start exploring the platform. We&apos;ll notify you when this
                        feature becomes available.
                    </p>
                </div>
            </div>

            {/* Platform Cards (Disabled) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platforms.map((platform) => {
                    const Icon = platform.icon;
                    return (
                        <Card key={platform.id} className="p-6 opacity-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`flex items-center justify-center w-12 h-12 rounded-lg ${platform.color}`}
                                    >
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {platform.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">Coming in Phase 4</p>
                                    </div>
                                </div>
                                <Button disabled variant="outline">
                                    Connect
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* What You Can Do Now */}
            <Card className="p-6 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    What You Can Do Now
                </h3>
                <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 text-purple-600 dark:text-purple-400">✓</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Explore your dashboard and familiarize yourself with the interface
                        </p>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 text-purple-600 dark:text-purple-400">✓</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Review and update your business profile settings
                        </p>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 text-purple-600 dark:text-purple-400">✓</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Upload additional brand assets if needed
                        </p>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 text-purple-600 dark:text-purple-400">✓</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Get ready for social media integration in the next phase
                        </p>
                    </li>
                </ul>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={handleBack} disabled={isCompleting}>
                    Back
                </Button>

                <Button onClick={handleComplete} disabled={isCompleting} size="lg">
                    {isCompleting ? 'Completing...' : 'Complete Onboarding'}
                </Button>
            </div>
        </div>
    );
}
