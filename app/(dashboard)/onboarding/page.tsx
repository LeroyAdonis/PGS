'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Zap, Globe, TrendingUp } from 'lucide-react';

export default function OnboardingWelcomePage() {
    const router = useRouter();

    const features = [
        {
            icon: Sparkles,
            title: 'AI-Powered Content',
            description: 'Generate engaging posts tailored to your brand and audience',
        },
        {
            icon: Zap,
            title: 'Autonomous Posting',
            description: 'Let AI handle your social media once it learns your preferences',
        },
        {
            icon: Globe,
            title: 'Multi-Language Support',
            description: "Reach audiences in all 11 South African official languages",
        },
        {
            icon: TrendingUp,
            title: 'Analytics & Insights',
            description: 'Track performance and optimize your social media strategy',
        },
    ];

    const handleGetStarted = () => {
        router.push('/onboarding/business-info');
    };

    return (
        <div className="space-y-8">
            {/* Welcome Message */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 mb-4">
                    <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Let&apos;s Build Your Social Media Presence
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Purple Glow Social uses AI to create, schedule, and post content for your business. In
                    just a few steps, we&apos;ll set up your profile and connect your social media accounts.
                </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature) => {
                    const Icon = feature.icon;
                    return (
                        <Card key={feature.title} className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                                        <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* What to Expect */}
            <Card className="p-6 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    What to Expect
                </h3>
                <ol className="space-y-3">
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-sm font-semibold">
                            1
                        </span>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Tell us about your business
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Share your industry, target audience, and brand preferences
                            </p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-sm font-semibold">
                            2
                        </span>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Upload brand assets
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Add your logo and visual identity to personalize your content
                            </p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-sm font-semibold">
                            3
                        </span>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Connect social accounts
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Link Facebook, Instagram, Twitter, and LinkedIn (optional)
                            </p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-sm font-semibold">
                            4
                        </span>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Start creating content
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Let AI generate your first posts and watch the magic happen
                            </p>
                        </div>
                    </li>
                </ol>
            </Card>

            {/* CTA */}
            <div className="flex justify-center pt-4">
                <Button size="lg" onClick={handleGetStarted} className="min-w-[200px]">
                    Get Started
                </Button>
            </div>

            {/* Time Estimate */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                ⏱️ Setup takes about 5 minutes
            </p>
        </div>
    );
}
