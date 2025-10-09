/**
 * Authentication Helper Functions
 * 
 * Utilities for working with Supabase authentication
 * in Server Components and Server Actions.
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current session
 * Returns null if not authenticated
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Require authentication - redirect to login if not authenticated
 * Use in Server Components that require auth
 * 
 * @param redirectTo - Optional path to redirect back to after login
 * @returns The authenticated user
 */
export async function requireAuth(redirectTo?: string) {
  const user = await getUser();

  if (!user) {
    const params = redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : "";
    redirect(`/login${params}`);
  }

  return user;
}

/**
 * Require admin role - redirect if not admin
 * Use in Server Components that require admin access
 * 
 * @returns The authenticated admin user
 */
export async function requireAdmin() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Check if user has admin role in database
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Get user profile data from database
 * Returns null if user not found
 */
export async function getUserProfile() {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding() {
  const user = await getUser();
  if (!user) return false;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .single();

  return !!profile?.onboarding_completed_at;
}
