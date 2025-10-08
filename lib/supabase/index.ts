/**
 * Supabase Module Exports
 * 
 * Central export point for all Supabase-related functionality
 */

// Client exports
export { createClient as createBrowserClient, supabase } from "./client";

// Server exports
export { createClient as createServerClient, createAdminClient } from "./server";

// Middleware exports
export { updateSession } from "./middleware";

// Auth helper exports
export {
  getUser,
  getSession,
  requireAuth,
  requireAdmin,
  signOut,
  getUserProfile,
  hasCompletedOnboarding,
} from "./auth";

// Type exports
export type { Database, Json } from "./database.types";
