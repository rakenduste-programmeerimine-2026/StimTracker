// @vitest-environment node
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";
import { config } from "@/middleware";

// Which requests the middleware (and so the /login redirect) runs on.

const runsOn = (url: string) => unstable_doesMiddlewareMatch({ config, url });

describe("middleware matcher", () => {
  it("runs on the app pages and the login page", () => {
    for (const url of ["/", "/add", "/history", "/settings", "/login", "/history?day=today"]) {
      expect(runsOn(url), url).toBe(true);
    }
  });

  it("skips Next.js internals", () => {
    for (const url of ["/_next/static/chunks/main.js", "/_next/static/media/font.woff2", "/_next/image?url=%2Fa.png&w=64&q=75"]) {
      expect(runsOn(url), url).toBe(false);
    }
  });

  it("skips static files", () => {
    for (const url of ["/favicon.ico", "/logo.svg", "/photo.webp", "/robots.txt", "/sitemap.xml", "/manifest.webmanifest", "/font.woff2"]) {
      expect(runsOn(url), url).toBe(false);
    }
  });
});
