import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database.types";

// Supabase client for Client Components. The session lives in cookies, so
// the server sees the same signed-in user. Typed with the generated
// database types, so typecheck catches wrong table and column names.
export function createClient() {
  const { url, publishableKey } = supabaseEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
