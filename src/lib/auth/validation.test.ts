import { describe, expect, it } from "vitest";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, parseSignIn, parseSignUp } from "@/lib/auth/validation";

describe("parseSignIn", () => {
  it("trims and lowercases the e-mail and keeps the password as typed", () => {
    expect(parseSignIn({ email: "  Mari@Example.COM ", password: " pass word " })).toEqual({
      ok: true,
      value: { email: "mari@example.com", password: " pass word " },
    });
  });

  it("does not check the password length, only that it is there", () => {
    expect(parseSignIn({ email: "mari@example.com", password: "abc" }).ok).toBe(true);
  });

  it("reports empty fields", () => {
    expect(parseSignIn({ email: " ", password: "" })).toEqual({
      ok: false,
      errors: { email: "Sisesta e-posti aadress.", password: "Sisesta parool." },
    });
  });

  it("treats missing or non-text fields as empty", () => {
    const result = parseSignIn({ email: null, password: new File([], "x") });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["email", "password"]);
  });

  it("rejects an e-mail without a domain", () => {
    const result = parseSignIn({ email: "mari@", password: "secret" });
    expect(result).toEqual({ ok: false, errors: { email: "E-posti aadress ei ole õiges vormingus." } });
  });
});

describe("parseSignUp", () => {
  it("accepts a password of the minimum length", () => {
    const password = "a".repeat(MIN_PASSWORD_LENGTH);
    expect(parseSignUp({ email: "mari@example.com", password })).toEqual({
      ok: true,
      value: { email: "mari@example.com", password },
    });
  });

  it("rejects a short password", () => {
    const result = parseSignUp({ email: "mari@example.com", password: "a".repeat(MIN_PASSWORD_LENGTH - 1) });
    expect(result).toEqual({
      ok: false,
      errors: { password: `Parool peab olema vähemalt ${MIN_PASSWORD_LENGTH} märki.` },
    });
  });

  it("rejects a password Supabase would refuse as too long", () => {
    const result = parseSignUp({ email: "mari@example.com", password: "a".repeat(MAX_PASSWORD_LENGTH + 1) });
    expect(result.ok).toBe(false);
  });

  it("reports every invalid field at once", () => {
    const result = parseSignUp({ email: "not an email", password: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["email", "password"]);
  });
});
