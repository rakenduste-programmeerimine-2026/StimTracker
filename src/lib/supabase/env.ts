// Supabase connection settings from .env.local (see .env.example).
//
// The variables are read with their full literal names so that Next.js can
// inline them into browser code. Only the publishable key is allowed: a
// secret key would bypass row level security, so the app refuses to start
// with one instead of quietly exposing every user's data.

export type SupabaseEnv = {
  url: string;
  publishableKey: string;
};

// True for keys that must never reach the app: the new secret keys
// (sb_secret_...) and the legacy JWT service_role key.
export function isSecretKey(key: string): boolean {
  if (key.startsWith("sb_secret_")) return true;

  const parts = key.split(".");
  if (parts.length !== 3) return false;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload: unknown = JSON.parse(atob(base64));
    return typeof payload === "object" && payload !== null && (payload as { role?: unknown }).role === "service_role";
  } catch {
    return false;
  }
}

// The settings, or null while .env.local has not been filled in yet.
// A secret key always throws, even here.
export function readSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) return null;
  if (isSecretKey(publishableKey)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY holds a secret key. Use the publishable key (sb_publishable_...).",
    );
  }
  return { url, publishableKey };
}

// The settings, for code that cannot work without Supabase.
export function supabaseEnv(): SupabaseEnv {
  const env = readSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local (see .env.example).",
    );
  }
  return env;
}
