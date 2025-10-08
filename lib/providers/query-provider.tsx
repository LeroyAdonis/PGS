/**
 * TanStack Query Provider
 * 
 * Client-side provider for React Query (TanStack Query v5)
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

// ============================================================================
// QUERY CLIENT CONFIGURATION
// ============================================================================

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Default stale time: 5 minutes
                staleTime: 5 * 60 * 1000,

                // Default cache time: 10 minutes
                gcTime: 10 * 60 * 1000,

                // Retry failed requests up to 3 times
                retry: 3,

                // Exponential backoff for retries
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

                // Refetch on window focus
                refetchOnWindowFocus: true,

                // Don't refetch on mount if data is fresh
                refetchOnMount: false,

                // Don't refetch on reconnect if data is fresh
                refetchOnReconnect: false,
            },
            mutations: {
                // Retry failed mutations once
                retry: 1,

                // Exponential backoff for mutation retries
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            },
        },
    });
}

// ============================================================================
// QUERY CLIENT PROVIDER
// ============================================================================

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
    if (typeof window === "undefined") {
        // Server: always make a new query client
        return makeQueryClient();
    } else {
        // Browser: make a new query client if we don't already have one
        // This is very important so we don't re-make a new client if React
        // suspends during the initial render. This may not be needed if we
        // have a suspense boundary BELOW the creation of the query client
        if (!browserQueryClient) browserQueryClient = makeQueryClient();
        return browserQueryClient;
    }
}

interface QueryProviderProps {
    children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    // NOTE: Avoid useState when initializing the query client if you don't
    //       have a suspense boundary between this and the code that may
    //       suspend because React will throw away the client on the initial
    //       render if it suspends and there is no boundary
    const queryClient = getQueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === "development" && (
                <ReactQueryDevtools initialIsOpen={false} position="bottom" />
            )}
        </QueryClientProvider>
    );
}

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

export const queryKeys = {
    // User queries
    user: {
        all: ["user"] as const,
        detail: () => [...queryKeys.user.all, "detail"] as const,
        profile: () => [...queryKeys.user.all, "profile"] as const,
    },

    // Business profile queries
    businessProfile: {
        all: ["businessProfile"] as const,
        detail: () => [...queryKeys.businessProfile.all, "detail"] as const,
        confidence: () => [...queryKeys.businessProfile.all, "confidence"] as const,
    },

    // Social account queries
    socialAccounts: {
        all: ["socialAccounts"] as const,
        list: () => [...queryKeys.socialAccounts.all, "list"] as const,
        detail: (id: string) => [...queryKeys.socialAccounts.all, "detail", id] as const,
        byPlatform: (platform: string) =>
            [...queryKeys.socialAccounts.all, "byPlatform", platform] as const,
    },

    // Subscription queries
    subscription: {
        all: ["subscription"] as const,
        detail: () => [...queryKeys.subscription.all, "detail"] as const,
        usage: () => [...queryKeys.subscription.all, "usage"] as const,
        events: (filters?: Record<string, unknown>) =>
            [...queryKeys.subscription.all, "events", filters] as const,
    },

    // Post queries
    posts: {
        all: ["posts"] as const,
        list: (filters?: Record<string, unknown>) => [...queryKeys.posts.all, "list", filters] as const,
        detail: (id: string) => [...queryKeys.posts.all, "detail", id] as const,
        byStatus: (status: string) => [...queryKeys.posts.all, "byStatus", status] as const,
    },

    // Analytics queries
    analytics: {
        all: ["analytics"] as const,
        overview: (filters?: Record<string, unknown>) =>
            [...queryKeys.analytics.all, "overview", filters] as const,
        byPost: (postId: string) => [...queryKeys.analytics.all, "byPost", postId] as const,
        byPlatform: (platform: string) => [...queryKeys.analytics.all, "byPlatform", platform] as const,
    },

    // Brand asset queries
    brandAssets: {
        all: ["brandAssets"] as const,
        list: () => [...queryKeys.brandAssets.all, "list"] as const,
        detail: (id: string) => [...queryKeys.brandAssets.all, "detail", id] as const,
        primary: () => [...queryKeys.brandAssets.all, "primary"] as const,
    },
} as const;
