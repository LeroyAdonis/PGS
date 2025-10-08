/**
 * Supabase Client - Browser Context
 * 
 * This client is used in Client Components and browser-side code.
 * It uses the browser's cookies for authentication state.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

/**
 * Get or create a Supabase client for browser usage
 * Singleton pattern ensures we reuse the same client instance
 */
export function createClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return supabaseClient;
}

/**
 * Default export for convenience
 */
export const supabase = createClient();
