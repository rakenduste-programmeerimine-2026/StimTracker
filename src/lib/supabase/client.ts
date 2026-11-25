import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/supabase/env";

// Supabase client for Client Components. The session lives in cookies, so
// the server sees the same signed-in user.
export function createClient() {
  const { url, publishableKey } = supabaseEnv();
  return createBrowserClient(url, publishableKey);
}
