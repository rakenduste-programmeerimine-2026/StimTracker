import { describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "@/lib/security/csp";

// The policy as { directive: sources }.
function parse(policy: string): Record<string, string[]> {
  return Object.fromEntries(
    policy.split("; ").map((directive) => {
      const [name, ...sources] = directive.split(" ");
      return [name, sources];
    }),
  );
}

describe("contentSecurityPolicy", () => {
  it("allows only the app's own origin by default", () => {
    const csp = parse(contentSecurityPolicy({ dev: false }));

    expect(csp["default-src"]).toEqual(["'self'"]);
    expect(csp["connect-src"]).toEqual(["'self'"]);
  });

  it("blocks plugins, frames, foreign forms and base tags", () => {
    const csp = parse(contentSecurityPolicy({ dev: false }));

    expect(csp["object-src"]).toEqual(["'none'"]);
    expect(csp["frame-ancestors"]).toEqual(["'none'"]);
    expect(csp["form-action"]).toEqual(["'self'"]);
    expect(csp["base-uri"]).toEqual(["'self'"]);
  });

  it("allows eval only in development", () => {
    expect(parse(contentSecurityPolicy({ dev: true }))["script-src"]).toContain("'unsafe-eval'");
    expect(parse(contentSecurityPolicy({ dev: false }))["script-src"]).not.toContain("'unsafe-eval'");
  });

  it("lets the browser connect to Supabase over https and websockets", () => {
    const csp = parse(contentSecurityPolicy({ dev: false, supabaseUrl: "https://abc.supabase.co/" }));

    expect(csp["connect-src"]).toEqual(["'self'", "https://abc.supabase.co", "wss://abc.supabase.co"]);
  });

  it("supports a local Supabase over http", () => {
    const csp = parse(contentSecurityPolicy({ dev: true, supabaseUrl: "http://127.0.0.1:54321" }));

    expect(csp["connect-src"]).toEqual(["'self'", "http://127.0.0.1:54321", "ws://127.0.0.1:54321"]);
  });

  it("ignores a Supabase URL that is missing or not http(s)", () => {
    for (const supabaseUrl of [undefined, null, "", "not a url", "javascript:alert(1)", "https://a.co; script-src *"]) {
      expect(parse(contentSecurityPolicy({ dev: false, supabaseUrl }))["connect-src"], String(supabaseUrl)).toEqual(["'self'"]);
    }
  });
});
