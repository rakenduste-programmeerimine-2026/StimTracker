// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Mock: @supabase/ssr ----------------------------------------------------
// getClaims() plays the part of a token refresh: it writes the cookies and
// cache headers that the test sets in `refresh`, and returns claims only
// when `session.signedIn` is true.

type CookieToSet = { name: string; value: string; options: Record<string, unknown> };
type CookieMethods = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: CookieToSet[], headers: Record<string, string>) => void;
};

const refresh: { cookies: CookieToSet[]; headers: Record<string, string> } = { cookies: [], headers: {} };
const seen: { cookiesAtStart: { name: string; value: string }[] } = { cookiesAtStart: [] };
const session = { signedIn: false };
const createServerClient = vi.fn((_url: string, _key: string, options: { cookies: CookieMethods }) => ({
  auth: {
    getClaims: async () => {
      seen.cookiesAtStart = options.cookies.getAll();
      if (refresh.cookies.length > 0) options.cookies.setAll(refresh.cookies, refresh.headers);
      return session.signedIn ? { data: { claims: { sub: "user-1" } }, error: null } : { data: null, error: null };
    },
  },
}));
vi.mock("@supabase/ssr", () => ({ createServerClient }));

const { updateSession } = await import("@/lib/supabase/middleware");

// --- Tests -------------------------------------------------------------------

function request(cookie?: string, path = "/", init: { method?: string; headers?: Record<string, string> } = {}) {
  const headers = { ...(cookie ? { cookie } : {}), ...init.headers };
  return new NextRequest(`http://localhost:3000${path}`, { method: init.method ?? "GET", headers });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc123");
  refresh.cookies = [];
  refresh.headers = {};
  session.signedIn = true;
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

describe("updateSession redirects", () => {
  beforeEach(() => {
    session.signedIn = false;
  });

  it("sends a signed-out user from an app page to /login", async () => {
    const response = await updateSession(request(undefined, "/history?day=today"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("lets a signed-out user open /login", async () => {
    const response = await updateSession(request(undefined, "/login"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("sends a signed-in user from /login to the Today page", async () => {
    session.signedIn = true;

    const response = await updateSession(request("sb-access=old", "/login"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("lets a signed-in user open the app pages", async () => {
    session.signedIn = true;

    for (const path of ["/", "/add", "/history", "/settings"]) {
      expect((await updateSession(request("sb-access=old", path))).status).toBe(200);
    }
  });

  it("does not redirect a Server Action call", async () => {
    const response = await updateSession(request(undefined, "/", { method: "POST", headers: { "next-action": "abc123" } }));

    expect(response.status).toBe(200);
  });

  it("redirects a plain POST to an app page like a page load", async () => {
    const response = await updateSession(request(undefined, "/", { method: "POST" }));

    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("keeps the cleared session cookies and no-cache headers on the redirect", async () => {
    refresh.cookies = [{ name: "sb-access", value: "", options: { path: "/", maxAge: 0 } }];
    refresh.headers = { "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0", Expires: "0" };

    const response = await updateSession(request("sb-access=expired", "/add"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
    expect(response.cookies.get("sb-access")?.value).toBe("");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("expires")).toBe("0");
  });

  it("does not redirect while .env.local is not filled in", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    expect((await updateSession(request(undefined, "/"))).status).toBe(200);
  });
});
