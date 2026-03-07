import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.warn("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
    // Return a mock client for build time
    return createClient<Database>("https://mock.supabase.co", "mock-key", {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  if (!serviceRoleKey) {
    console.warn("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
    // Return a mock client for build time
    return createClient<Database>(supabaseUrl, "mock-key", {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch {
    console.warn(`Invalid Supabase URL format: ${supabaseUrl}`);
    // Return a mock client for build time
    return createClient<Database>("https://mock.supabase.co", serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
