// Content Security Policy: which sources the browser may load scripts,
// styles, images and connections from. Anything else is blocked, so injected
// markup cannot pull in scripts from another site or send data to it.

export type CspOptions = {
  // next dev needs eval for fast refresh; the production build does not.
  dev: boolean;
  // NEXT_PUBLIC_SUPABASE_URL, so the browser may talk to Supabase directly.
  supabaseUrl?: string | null;
};

// The origin of a http(s) URL, or null for anything else.
function httpOrigin(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.origin : null;
  } catch {
    return null;
  }
}

export function contentSecurityPolicy({ dev, supabaseUrl }: CspOptions): string {
  const supabase = httpOrigin(supabaseUrl);
  // Supabase Realtime uses a websocket on the same host.
  const supabaseSources = supabase ? [supabase, supabase.replace(/^http/, "ws")] : [];

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // Next.js and the theme script in the root layout use inline scripts.
    "script-src": ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", ...supabaseSources],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(" ")}`)
    .join("; ");
}
