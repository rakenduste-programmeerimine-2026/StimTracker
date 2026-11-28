// @vitest-environment node
import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";
import { SECURITY_HEADERS } from "@/lib/security/headers";

// What next.config.ts tells Next.js to send.

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
});
