/**
 * Purple Glow Social - Application Constants
 * 
 * Centralized constants for enums, configuration, and shared values
 * across the application.
 */

// ============================================================================
// SOUTH AFRICAN OFFICIAL LANGUAGES
// ============================================================================

export const SA_LANGUAGES = [
  "Afrikaans",
  "English",
  "isiNdebele",
  "isiXhosa",
  "isiZulu",
  "Sesotho",
  "Setswana",
  "Sepedi",
  "siSwati",
  "Tshivenda",
  "Xitsonga",
] as const;

export type SALanguage = (typeof SA_LANGUAGES)[number];

// ============================================================================
// SOCIAL MEDIA PLATFORMS
// ============================================================================

export const SOCIAL_PLATFORMS = ["facebook", "instagram", "twitter", "linkedin"] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const PLATFORM_DISPLAY_NAMES: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X (Twitter)",
  linkedin: "LinkedIn",
};

export const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
};

// ============================================================================
// SUBSCRIPTION TIERS
// ============================================================================

export const SUBSCRIPTION_TIERS = ["trial", "starter", "growth", "enterprise"] as const;

export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export const TIER_LIMITS: Record<SubscriptionTier, { monthlyPosts: number; amountZAR: number }> = {
  trial: { monthlyPosts: 50, amountZAR: 0 },
  starter: { monthlyPosts: 10, amountZAR: 99 },
  growth: { monthlyPosts: 50, amountZAR: 299 },
  enterprise: { monthlyPosts: -1, amountZAR: 999 }, // -1 = unlimited
};

export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  trial: [
    "14-day free trial",
    "50 posts per month",
    "AI content generation",
    "Multi-language support",
    "4 social platforms",
  ],
  starter: [
    "10 posts per month",
    "AI content generation",
    "Multi-language support",
    "4 social platforms",
    "Basic analytics",
  ],
  growth: [
    "50 posts per month",
    "AI content generation",
    "AI image generation",
    "Multi-language support",
    "4 social platforms",
    "Advanced analytics",
    "Priority support",
  ],
  enterprise: [
    "Unlimited posts",
    "AI content generation",
    "AI image generation",
    "Multi-language support",
    "4 social platforms",
    "Advanced analytics",
    "Dedicated account manager",
    "Custom integrations",
  ],
};

// ============================================================================
// CONTENT TONES
// ============================================================================

export const CONTENT_TONES = ["professional", "friendly", "humorous", "inspirational"] as const;

export type ContentTone = (typeof CONTENT_TONES)[number];

export const TONE_DESCRIPTIONS: Record<ContentTone, string> = {
  professional: "Formal and business-focused",
  friendly: "Warm and conversational",
  humorous: "Light-hearted and entertaining",
  inspirational: "Motivational and uplifting",
};

// ============================================================================
// POST STATUS
// ============================================================================

export const POST_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "scheduled",
  "published",
  "failed",
  "archived",
] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

export const STATUS_COLORS: Record<PostStatus, string> = {
  draft: "gray",
  pending_approval: "yellow",
  approved: "green",
  scheduled: "blue",
  published: "purple",
  failed: "red",
  archived: "gray",
};

// ============================================================================
// SUBSCRIPTION STATUS
// ============================================================================

export const SUBSCRIPTION_STATUSES = ["active", "past_due", "canceled", "paused"] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

// ============================================================================
// USER ROLES
// ============================================================================

export const USER_ROLES = ["user", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

// ============================================================================
// BRAND ASSET TYPES
// ============================================================================

export const BRAND_ASSET_TYPES = ["logo", "banner", "pattern", "other"] as const;

export type BrandAssetType = (typeof BRAND_ASSET_TYPES)[number];

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API_CONFIG = {
  AI_GENERATION_TIMEOUT_MS: 30000, // 30 seconds
  IMAGE_GENERATION_TIMEOUT_MS: 60000, // 60 seconds
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
} as const;

// ============================================================================
// PERFORMANCE TARGETS (from NFRs)
// ============================================================================

export const PERFORMANCE_TARGETS = {
  TEXT_GENERATION_MS: 3000, // <3 seconds
  IMAGE_GENERATION_MS: 10000, // <10 seconds
  DASHBOARD_LOAD_MS: 2000, // <2 seconds
  API_RESPONSE_P95_MS: 200, // <200ms p95
} as const;

// ============================================================================
// CONFIDENCE SCORE THRESHOLDS
// ============================================================================

export const CONFIDENCE_CONFIG = {
  AUTOMATION_THRESHOLD: 80.0,
  EXCELLENT_THRESHOLD: 90.0,
  GOOD_THRESHOLD: 70.0,
  FAIR_THRESHOLD: 50.0,
  
  // Scoring weights
  WEIGHTS: {
    APPROVED_NO_EDIT: 10,
    MINOR_EDITS: 5,
    MAJOR_EDITS: -3,
    REJECTED: -5,
  },
} as const;

// ============================================================================
// FILE UPLOAD LIMITS
// ============================================================================

export const FILE_UPLOAD_LIMITS = {
  MAX_IMAGE_SIZE_MB: 10,
  MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
} as const;

// ============================================================================
// ANALYTICS SYNC INTERVALS
// ============================================================================

export const SYNC_INTERVALS = {
  ANALYTICS_HOURS: 4,
  TOKEN_REFRESH_HOURS: 1,
  CONFIDENCE_CALC_HOURS: 24,
  POST_PUBLISHING_MINUTES: 1,
} as const;
