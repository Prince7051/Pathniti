// Modern Supabase client - consolidated from legacy implementations
// This file provides a clean interface for the most common Supabase operations

import { createClient } from "./supabase/client";
import { createOfflineAwareClient } from "./supabase/offline-client";
import type { Database, UserProfile } from "./supabase/types";

// Create a singleton client instance with offline support
let supabaseClient: ReturnType<typeof createOfflineAwareClient> | null = null;

function getSupabaseClient(): ReturnType<typeof createOfflineAwareClient> {
  if (!supabaseClient) {
    try {
      supabaseClient = createOfflineAwareClient();
      console.log("[Supabase] Singleton client created successfully");
    } catch (error) {
      console.error("Failed to create Supabase client:", error);
      throw error;
    }
  }
  return supabaseClient;
}

// Export the singleton client instance directly
export const supabase = getSupabaseClient();

// Safe wrapper for getUser() that checks for session first
export async function safeGetUser() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return { data: { user: null }, error: new Error("No active session") };
    }
    return await supabase.auth.getUser();
  } catch (error) {
    console.warn("safeGetUser failed:", error);
    return { data: { user: null }, error };
  }
}

// Export types
export type { Database, UserProfile };

// Re-export the client creation function for browser usage
export { createClient as createSupabaseClient } from "./supabase/client";

// Note: createServerClient and createServiceClient should be imported directly
// from their respective files to avoid "next/headers" issues in client components
