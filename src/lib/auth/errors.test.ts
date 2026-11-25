import { beforeEach, describe, expect, it, vi } from "vitest";
import { GENERIC_AUTH_ERROR, authErrorMessage } from "@/lib/auth/errors";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("authErrorMessage", () => {
  it("translates known Supabase error codes", () => {
    expect(authErrorMessage({ code: "invalid_credentials", message: "Invalid login credentials" }, "sign in")).toBe(
      "Vale e-post või parool.",
    );
    expect(authErrorMessage({ code: "user_already_exists", message: "User already registered" }, "sign up")).toMatch(
      /juba olemas/,
    );
  });

  it("treats HTTP 429 without a known code as too many attempts", () => {
    expect(authErrorMessage({ status: 429, message: "Too many requests" }, "sign in")).toMatch(/Liiga palju katseid/);
  });

  it("never shows the raw message for unknown errors", () => {
    const message = authErrorMessage({ code: "unexpected_failure", message: "database is down" }, "sign in");
    expect(message).toBe(GENERIC_AUTH_ERROR);
  });

  it("logs the raw error on the server", () => {
    authErrorMessage({ code: "unexpected_failure", status: 500, message: "database is down" }, "sign in");
    expect(console.error).toHaveBeenCalledWith("[auth] sign in failed", "unexpected_failure", 500, "database is down");
  });
});
