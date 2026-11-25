// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Mock: @supabase/ssr ----------------------------------------------------
// getClaims() plays the part of a token refresh: it writes the cookies and
// cache headers that the test sets in `refresh`.

type CookieToSet = { name: string; value: string; options: Record<string, unknown> };
type CookieMethods = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: CookieToSet[], headers: Record<string, string>) => void;
};

const refresh: { cookies: CookieToSet[]; headers: Record<string, string> } = { cookies: [], headers: {} };
const seen: { cookiesAtStart: { name: string; value: string }[] } = { cookiesAtStart: [] };
const createServerClient = vi.fn((_url: string, _key: string, options: { cookies: CookieMethods }) => ({
  auth: {
    getClaims: async () => {
      seen.cookiesAtStart = options.cookies.getAll();
      if (refresh.cookies.length > 0) options.cookies.setAll(refresh.cookies, refresh.headers);
      return { data: null, error: null };
    },
  },
}));
vi.mock("@supabase/ssr", () => ({ createServerClient }));

const { updateSession } = await import("@/lib/supabase/middleware");

// --- Tests -------------------------------------------------------------------

function request(cookie?: string) {
  return new NextRequest("http://localhost:3000/", { headers: cookie ? { cookie } : {} });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc123");
  refresh.cookies = [];
  refresh.headers = {};
  createServerClient.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("updateSession", () => {
  it("passes the request cookies to Supabase", async () => {
    await updateSession(request("sb-access=old"));
    expect(seen.cookiesAtStart).toEqual([{ name: "sb-access", value: "old" }]);
  });

  it("leaves the response alone when the session is still valid", async () => {
    const response = await updateSession(request("sb-access=old"));
    expect(response.cookies.getAll()).toEqual([]);
    expect(response.headers.get("cache-control")).toBeNull();
  });

  it("writes refreshed cookies and no-cache headers to the response", async () => {
    refresh.cookies = [{ name: "sb-access", value: "new", options: { path: "/" } }];
    refresh.headers = { "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0" };

    const response = await updateSession(request("sb-access=old"));

    expect(response.cookies.get("sb-access")?.value).toBe("new");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("skips Supabase while .env.local is not filled in", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const response = await updateSession(request());

    expect(createServerClient).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });
});
