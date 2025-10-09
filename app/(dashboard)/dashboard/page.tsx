'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/auth/logout', { method: 'POST' });
            if (response.ok) {
                router.push('/login');
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
            <div className="container max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Welcome to Your Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Your onboarding is complete! 🎉
                        </p>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>

                {/* Coming Soon Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                    AI Content Generation
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Coming in Phase 5
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                    Create engaging posts with AI assistance
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                    Analytics Dashboard
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Coming in Phase 9
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                    Track your social media performance
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20">
                                <Settings className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                    Settings & Profile
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Coming in Phase 10
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                    Manage your account and preferences
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Success Message */}
                <Card className="mt-8 p-8 bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                    <div className="text-center max-w-2xl mx-auto">
                        <h2 className="text-2xl font-bold mb-4">
                            🎉 Congratulations on Completing Onboarding!
                        </h2>
                        <p className="text-purple-100 mb-6">
                            You&apos;ve successfully set up your business profile and brand identity. Your
                            account is ready for the upcoming features. Stay tuned for exciting updates as we
                            roll out AI-powered content generation, social media integration, and advanced
                            analytics.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                variant="secondary"
                                onClick={() => router.push('/onboarding/business-info')}
                            >
                                Edit Business Profile
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => router.push('/onboarding/brand-identity')}
                            >
                                Manage Brand Assets
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* What's Next */}
                <Card className="mt-8 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        What&apos;s Next?
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                                1
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    Phase 4: Social Media Integration
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Connect Facebook, Instagram, Twitter, and LinkedIn accounts
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                                2
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    Phase 5: AI Content Generation
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Create posts with AI assistance using Google Gemini
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                                3
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    Phase 6: Post Scheduling & Publishing
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Schedule and automatically publish content to your platforms
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
