import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "@/lib/supabase/env";

// Supabase client for Server Components, Server Actions and Route Handlers.
// Create a new one for every request; never share it between requests.
export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = supabaseEnv();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies. That is fine: the
          // middleware refreshes the session before the page renders.
        }
      },
    },
  });
}
