import { describe, expect, it } from "vitest";
import { HOME_PATH, LOGIN_PATH, isPublicPath, redirectFor } from "@/lib/auth/routes";

const get = (pathname: string, signedIn: boolean) => redirectFor({ pathname, signedIn, isServerAction: false });

describe("isPublicPath", () => {
  it("treats the login page as public", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/login/")).toBe(true);
  });

  it("treats the app pages as private", () => {
    for (const path of ["/", "/add", "/history", "/settings"]) expect(isPublicPath(path)).toBe(false);
  });

  it("does not match paths that only start with the same letters", () => {
    expect(isPublicPath("/loginx")).toBe(false);
    expect(isPublicPath("/history/login")).toBe(false);
  });
});

describe("redirectFor", () => {
  it("sends a signed-out user from the app pages to the login page", () => {
    for (const path of ["/", "/add", "/history", "/settings", "/does-not-exist"]) {
      expect(get(path, false)).toBe(LOGIN_PATH);
    }
  });

  it("lets a signed-out user open the login page", () => {
    expect(get("/login", false)).toBeNull();
  });

  it("sends a signed-in user from the login page to the Today page", () => {
    expect(get("/login", true)).toBe(HOME_PATH);
  });

  it("lets a signed-in user open the app pages", () => {
    for (const path of ["/", "/add", "/history", "/settings"]) expect(get(path, true)).toBeNull();
  });

  it("never redirects a Server Action call", () => {
    expect(redirectFor({ pathname: "/", signedIn: false, isServerAction: true })).toBeNull();
    expect(redirectFor({ pathname: "/login", signedIn: true, isServerAction: true })).toBeNull();
  });
});
