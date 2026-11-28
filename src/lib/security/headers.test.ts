import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS } from "@/lib/security/headers";

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
