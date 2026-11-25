import { afterEach, describe, expect, it, vi } from "vitest";
import { isSecretKey, readSupabaseEnv, supabaseEnv } from "@/lib/supabase/env";

// Builds an unsigned JWT-shaped key with the given payload.
function jwt(payload: object): string {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, "");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

describe("isSecretKey", () => {
  it("accepts publishable keys", () => {
    expect(isSecretKey("sb_publishable_abc123")).toBe(false);
    expect(isSecretKey(jwt({ role: "anon" }))).toBe(false);
  });

  it("rejects new secret keys", () => {
    expect(isSecretKey("sb_secret_abc123")).toBe(true);
  });

  it("rejects the legacy service_role key", () => {
    expect(isSecretKey(jwt({ role: "service_role" }))).toBe(true);
  });

  it("treats keys it cannot read as not secret", () => {
    expect(isSecretKey("a.b.c")).toBe(false);
    expect(isSecretKey("")).toBe(false);
  });
});

describe("supabaseEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the URL and publishable key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc123");
    expect(supabaseEnv()).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_abc123",
    });
  });

  it("explains what is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc123");
    expect(() => supabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("refuses a secret key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_abc123");
    expect(() => supabaseEnv()).toThrow(/secret key/);
  });
});

describe("readSupabaseEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null while the settings are missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(readSupabaseEnv()).toBeNull();
  });

  it("still refuses a secret key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_abc123");
    expect(() => readSupabaseEnv()).toThrow(/secret key/);
  });
});
