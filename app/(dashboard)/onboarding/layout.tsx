'use client';

import React from 'react';
import { ProgressStepper, type Step } from '@/components/onboarding/progress-stepper';

const ONBOARDING_STEPS: Step[] = [
    {
        id: 'welcome',
        label: 'Welcome',
        description: 'Get started',
    },
    {
        id: 'business-info',
        label: 'Business Info',
        description: 'Tell us about your business',
    },
    {
        id: 'brand-identity',
        label: 'Brand Identity',
        description: 'Upload your brand assets',
    },
    {
        id: 'social-connect',
        label: 'Connect Accounts',
        description: 'Link your social media',
    },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    // Determine current step based on the URL pathname
    const [currentStep, setCurrentStep] = React.useState(0);

    React.useEffect(() => {
        // Update step based on current pathname
        const path = window.location.pathname;
        if (path.includes('/business-info')) {
            setCurrentStep(1);
        } else if (path.includes('/brand-identity')) {
            setCurrentStep(2);
        } else if (path.includes('/social-connect')) {
            setCurrentStep(3);
        } else {
            setCurrentStep(0);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
            <div className="container max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome to Purple Glow Social
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Let&apos;s set up your business profile and get you started
                    </p>
                </div>

                {/* Progress Stepper */}
                <div className="mb-8">
                    <ProgressStepper steps={ONBOARDING_STEPS} currentStep={currentStep} />
                </div>

                {/* Content Area */}
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 md:p-8">
                    {children}
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
                    Need help?{' '}
                    <a
                        href="mailto:support@purpleglowsocial.com"
                        className="text-purple-600 dark:text-purple-400 hover:underline"
                    >
                        Contact Support
                    </a>
                </div>
            </div>
        </div>
    );
}
