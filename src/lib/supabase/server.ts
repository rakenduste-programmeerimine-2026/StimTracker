import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database.types";

// Supabase client for Server Components, Server Actions and Route Handlers.
// Create a new one for every request; never share it between requests.
// Typed with the generated database types (src/types/database.types.ts).
export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = supabaseEnv();

  return createServerClient<Database>(url, publishableKey, {
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
