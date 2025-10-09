/**
 * Rate Limiter Middleware
 * 
 * Rate limiting for API routes using api_rate_limits table
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RateLimitError } from "./error-handler";
import type { Database } from "@/lib/supabase/database.types";

// ============================================================================
// TYPES
// ============================================================================

type RateLimitPlatform = "facebook" | "instagram" | "twitter" | "linkedin" | "gemini";

export interface RateLimitConfig {
  platform: RateLimitPlatform;
  limitType: string;
  callsLimit: number;
  windowDurationMs: number;
}

// ============================================================================
// DEFAULT RATE LIMIT CONFIGURATIONS
// ============================================================================

export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // API endpoint rate limits
  api_default: {
    platform: "gemini", // Using 'gemini' as a generic platform for API limits
    limitType: "api_default",
    callsLimit: 100,
    windowDurationMs: 60000, // 1 minute
  },
  api_post_creation: {
    platform: "gemini",
    limitType: "api_post_creation",
    callsLimit: 10,
    windowDurationMs: 60000, // 1 minute
  },
  api_image_generation: {
    platform: "gemini",
    limitType: "api_image_generation",
    callsLimit: 5,
    windowDurationMs: 60000, // 1 minute
  },

  // Gemini AI rate limits
  gemini_text: {
    platform: "gemini",
    limitType: "text_generation",
    callsLimit: 60,
    windowDurationMs: 60000, // 60 requests per minute
  },
  gemini_image: {
    platform: "gemini",
    limitType: "image_generation",
    callsLimit: 10,
    windowDurationMs: 60000, // 10 requests per minute
  },

  // Social media platform rate limits (based on platform APIs)
  facebook_post: {
    platform: "facebook",
    limitType: "post_creation",
    callsLimit: 200,
    windowDurationMs: 3600000, // 200 per hour
  },
  instagram_post: {
    platform: "instagram",
    limitType: "post_creation",
    callsLimit: 25,
    windowDurationMs: 86400000, // 25 per day
  },
  twitter_post: {
    platform: "twitter",
    limitType: "post_creation",
    callsLimit: 300,
    windowDurationMs: 10800000, // 300 per 3 hours
  },
  linkedin_post: {
    platform: "linkedin",
    limitType: "post_creation",
    callsLimit: 100,
    windowDurationMs: 86400000, // 100 per day
  },
};

// ============================================================================
// RATE LIMITER
// ============================================================================

export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const supabase = await createClient();

  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowDurationMs);

  // Get or create rate limit record
  const { data: rateLimit, error: fetchError } = await supabase
    .from("api_rate_limits")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", config.platform)
    .eq("limit_type", config.limitType)
    .gte("window_start", windowStart.toISOString())
    .single();

  // If no active window exists, create one
  if (!rateLimit || fetchError) {
    const resetsAt = new Date(now.getTime() + config.windowDurationMs);

    const { error: insertError } = await supabase.from("api_rate_limits").insert({
      user_id: userId,
      platform: config.platform,
      limit_type: config.limitType,
      calls_made: 1,
      calls_limit: config.callsLimit,
      window_duration: `${config.windowDurationMs / 1000} seconds`,
      window_start: now.toISOString(),
      resets_at: resetsAt.toISOString(),
    });

    if (insertError) {
      console.error("Error creating rate limit record:", insertError);
    }

    return { allowed: true };
  }

  // Check if limit is exceeded
  if (rateLimit.calls_made >= rateLimit.calls_limit) {
    const retryAfter = Math.ceil(
      (new Date(rateLimit.resets_at).getTime() - now.getTime()) / 1000
    );
    return { allowed: false, retryAfter };
  }

  // Increment calls made
  const { error: updateError } = await supabase
    .from("api_rate_limits")
    .update({ calls_made: rateLimit.calls_made + 1 })
    .eq("id", rateLimit.id);

  if (updateError) {
    console.error("Error updating rate limit:", updateError);
  }

  return { allowed: true };
}

// ============================================================================
// RATE LIMIT MIDDLEWARE
// ============================================================================

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  configKey: keyof typeof DEFAULT_RATE_LIMITS = "api_default"
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Get user ID from request (requires authentication)
    // This is a simplified version - in production, extract from auth token
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      throw new RateLimitError("User authentication required for rate limiting");
    }

    const config = DEFAULT_RATE_LIMITS[configKey];
    const { allowed, retryAfter } = await checkRateLimit(userId, config);

    if (!allowed) {
      const response = NextResponse.json(
        {
          error: {
            message: "Rate limit exceeded",
            code: "RATE_LIMIT_EXCEEDED",
            statusCode: 429,
            details: { retryAfter },
            timestamp: new Date().toISOString(),
          },
        },
        { status: 429 }
      );

      if (retryAfter) {
        response.headers.set("Retry-After", String(retryAfter));
        response.headers.set("X-RateLimit-Limit", String(config.callsLimit));
        response.headers.set("X-RateLimit-Remaining", "0");
        response.headers.set("X-RateLimit-Reset", String(Math.floor(Date.now() / 1000) + retryAfter));
      }

      return response;
    }

    return handler(req);
  };
}

// ============================================================================
// RATE LIMIT HEADERS HELPER
// ============================================================================

export function addRateLimitHeaders(
  response: NextResponse,
  config: RateLimitConfig,
  callsMade: number
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(config.callsLimit));
  response.headers.set("X-RateLimit-Remaining", String(config.callsLimit - callsMade));
  return response;
}
