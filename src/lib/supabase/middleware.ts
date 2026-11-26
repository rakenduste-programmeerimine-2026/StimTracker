import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { redirectFor } from "@/lib/auth/routes";
import { readSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database.types";

// Refreshes the Supabase session on every request, so Server Components
// and Server Actions always see a valid sign-in, and sends the browser to
// the right page: signed-out users to /login, signed-in users away from it
// (rules in src/lib/auth/routes.ts). Row level security still guards the
// data itself; the redirect only keeps people off pages they cannot use.
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  // Without .env.local the app still runs (for example on the mock store),
  // there is just no session to refresh and nobody to send to /login.
  const env = readSupabaseEnv();
  if (!env) return response;

  const supabase = createServerClient<Database>(env.url, env.publishableKey, {
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
  // an expired session and triggers setAll above. It also checks the
  // token's signature, so a forged cookie does not count as signed in.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const target = redirectFor({
    pathname: request.nextUrl.pathname,
    signedIn,
    isServerAction: request.headers.has("next-action"),
  });
  if (!target) return response;
  return redirectWithSession(request, response, target);
}

// Headers @supabase/ssr sets so that no cache keeps a session token.
const NO_CACHE_HEADERS = ["cache-control", "expires", "pragma"];

// A redirect is a new response, so the refreshed session cookies and the
// no-cache headers have to be copied onto it, or the browser loses them.
function redirectWithSession(request: NextRequest, response: NextResponse, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  const redirect = NextResponse.redirect(url);
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  for (const name of NO_CACHE_HEADERS) {
    const value = response.headers.get(name);
    if (value) redirect.headers.set(name, value);
  }
  return redirect;
}
