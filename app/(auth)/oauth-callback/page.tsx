'use client';

/**
 * OAuth Callback Page
 * Handles OAuth redirect from social providers
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function OAuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            const supabase = createClient();

            // Get the code from URL params
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error('OAuth error:', error);
                toast.error('Authentication failed');
                router.push('/login');
                return;
            }

            if (data.session) {
                toast.success('Successfully authenticated!');

                // Check if user has business profile
                const response = await fetch('/api/business-profiles');

                if (response.status === 404) {
                    // No business profile, redirect to onboarding
                    router.push('/onboarding');
                } else {
                    // Has business profile, redirect to dashboard
                    router.push('/dashboard');
                }
            } else {
                router.push('/login');
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent mb-4"></div>
                <p className="text-gray-600">Completing authentication...</p>
            </div>
        </div>
    );
}
