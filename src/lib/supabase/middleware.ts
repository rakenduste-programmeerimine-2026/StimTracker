import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { readSupabaseEnv } from "@/lib/supabase/env";

// Refreshes the Supabase session on every request, so Server Components
// and Server Actions always see a valid sign-in. Pages are not protected
// here yet: row level security already hides other users' data.
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  // Without .env.local the app still runs (for example on the mock store),
  // there is just no session to refresh.
  const env = readSupabaseEnv();
  if (!env) return response;

  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        // The page rendered after this must see the new cookies too.
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        // Stops CDNs from caching a response that carries a session token.
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  // Keep this call right after creating the client: it is what refreshes
  // an expired session and triggers setAll above.
  await supabase.auth.getClaims();

  return response;
}
