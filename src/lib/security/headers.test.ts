import { describe, expect, it } from "vitest";
import { HSTS_HEADER, SECURITY_HEADERS, securityHeaders } from "@/lib/security/headers";

const value = (key: string) => SECURITY_HEADERS.find((header) => header.key === key)?.value;

describe("SECURITY_HEADERS", () => {
  it("stops the browser from guessing content types", () => {
    expect(value("X-Content-Type-Options")).toBe("nosniff");
  });

  it("forbids showing the app in a frame", () => {
    expect(value("X-Frame-Options")).toBe("DENY");
  });

  it("does not leak page paths to other sites", () => {
    expect(value("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("turns off camera, microphone and location", () => {
    expect(value("Permissions-Policy")).toMatch(/camera=\(\)/);
    expect(value("Permissions-Policy")).toMatch(/microphone=\(\)/);
    expect(value("Permissions-Policy")).toMatch(/geolocation=\(\)/);
  });

  it("lists every header once", () => {
    const keys = SECURITY_HEADERS.map((header) => header.key.toLowerCase());
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("securityHeaders", () => {
  it("adds the Content Security Policy to the fixed headers", () => {
    const headers = securityHeaders({ dev: false });

    expect(headers).toEqual(expect.arrayContaining(SECURITY_HEADERS));
    expect(headers.find((header) => header.key === "Content-Security-Policy")?.value).toMatch(/^default-src 'self'/);
  });

  it("asks for https only outside development", () => {
    expect(securityHeaders({ dev: false })).toContainEqual(HSTS_HEADER);
    expect(securityHeaders({ dev: true }).map((header) => header.key)).not.toContain("Strict-Transport-Security");
  });

  it("keeps HSTS for at least a year", () => {
    const maxAge = Number(/max-age=(\d+)/.exec(HSTS_HEADER.value)?.[1]);
    expect(maxAge).toBeGreaterThanOrEqual(365 * 24 * 60 * 60);
  });
});
