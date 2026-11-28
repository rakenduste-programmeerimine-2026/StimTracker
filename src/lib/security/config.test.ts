// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import nextConfig from "../../../next.config";
import { SECURITY_HEADERS } from "@/lib/security/headers";

// What next.config.ts tells Next.js to send.

afterEach(() => {
  vi.unstubAllEnvs();
});

async function headerRules() {
  if (!nextConfig.headers) throw new Error("next.config.ts has no headers()");
  return nextConfig.headers();
}

describe("next.config headers", () => {
  it("sends the security headers on every path", async () => {
    const rules = await headerRules();

    expect(rules).toHaveLength(1);
    expect(rules[0].source).toBe("/:path*");
    expect(rules[0].headers).toEqual(expect.arrayContaining(SECURITY_HEADERS));
  });

  it("adds a Content Security Policy that allows the Supabase project", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");

    const [rule] = await headerRules();
    const csp = rule.headers.find((header) => header.key === "Content-Security-Policy")?.value;

    expect(csp).toContain("connect-src 'self' https://abc.supabase.co wss://abc.supabase.co");
  });

  it("does not send the X-Powered-By header", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});
