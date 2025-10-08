/**
 * Environment Variables Validation
 * 
 * This module validates that all required environment variables are present.
 * Run this at application startup to catch configuration issues early.
 */

const requiredEnvVars = {
  // Supabase (Critical - App won't work without these)
  supabase: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ],
  
  // Google Gemini (Required for AI features)
  ai: [
    'GOOGLE_GEMINI_API_KEY',
  ],
  
  // Payment Processing (Required for subscriptions)
  payments: [
    'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY',
    'PAYSTACK_SECRET_KEY',
  ],
  
  // Social Media OAuth (Required for Phase 3)
  socialMedia: [
    'FACEBOOK_CLIENT_ID',
    'FACEBOOK_CLIENT_SECRET',
    'INSTAGRAM_CLIENT_ID',
    'INSTAGRAM_CLIENT_SECRET',
    'TWITTER_CLIENT_ID',
    'TWITTER_CLIENT_SECRET',
    'LINKEDIN_CLIENT_ID',
    'LINKEDIN_CLIENT_SECRET',
  ],
} as const;

const optionalEnvVars = {
  // Optional but recommended
  optional: [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'UNSPLASH_ACCESS_KEY',
    'NEXT_PUBLIC_COPILOTKIT_PUBLIC_KEY',
  ],
} as const;

interface ValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validates that all required environment variables are present
 */
export function validateEnv(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  Object.entries(requiredEnvVars).forEach(([category, vars]) => {
    vars.forEach((varName) => {
      if (!process.env[varName]) {
        missing.push(`${varName} (${category})`);
      }
    });
  });

  // Check optional variables
  Object.entries(optionalEnvVars).forEach(([category, vars]) => {
    vars.forEach((varName) => {
      if (!process.env[varName]) {
        warnings.push(`${varName} (${category})`);
      }
    });
  });

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Validates environment and logs detailed results
 */
export function validateEnvOrThrow(): void {
  const result = validateEnv();

  if (!result.isValid) {
    console.error('❌ Missing required environment variables:');
    result.missing.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease check your .env.local file and ensure all required variables are set.');
    throw new Error('Missing required environment variables');
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Optional environment variables not set:');
    result.warnings.forEach((varName) => {
      console.warn(`   - ${varName}`);
    });
    console.warn('\nSome features may not work without these variables.\n');
  }

  console.log('✅ All required environment variables are set');
}

/**
 * Get environment-specific configuration
 */
export const env = {
  // Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  // AI Services
  ai: {
    geminiApiKey: process.env.GOOGLE_GEMINI_API_KEY!,
  },
  
  // Payments
  payments: {
    paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY!,
    paystackWebhookUrl: process.env.PAYSTACK_WEBHOOK_URL,
  },
  
  // Social Media OAuth
  oauth: {
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      redirectUri: process.env.FACEBOOK_REDIRECT_URI,
    },
    instagram: {
      clientId: process.env.INSTAGRAM_CLIENT_ID!,
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!,
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
      redirectUri: process.env.INSTAGRAM_REDIRECT_URI,
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      apiKey: process.env.TWITTER_API_KEY,
      apiSecret: process.env.TWITTER_API_SECRET,
      bearerToken: process.env.TWITTER_BEARER_TOKEN,
      redirectUri: process.env.TWITTER_REDIRECT_URI,
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      redirectUri: process.env.LINKEDIN_REDIRECT_URI,
    },
  },
  
  // External APIs
  external: {
    unsplash: {
      accessKey: process.env.UNSPLASH_ACCESS_KEY,
      secretKey: process.env.UNSPLASH_SECRET_KEY,
    },
    copilotKit: {
      publicKey: process.env.NEXT_PUBLIC_COPILOTKIT_PUBLIC_KEY,
    },
  },
  
  // Security
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY,
    internalFunctionSecret: process.env.INTERNAL_FUNCTION_SECRET,
    functionSecretKey: process.env.FUNCTION_SECRET_KEY,
  },
  
  // App Configuration
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development',
  },
} as const;

// Validate on module import (only in Node.js environment)
if (typeof window === 'undefined') {
  // Only validate in server-side code
  try {
    validateEnvOrThrow();
  } catch (error) {
    // In development, we want to see the error
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  }
}
