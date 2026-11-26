import { describe, expect, it } from "vitest";
import { parseSettings } from "@/lib/settings/input";

describe("parseSettings", () => {
  it("accepts limits inside the allowed range", () => {
    expect(parseSettings({ caffeineLimitMg: 400, nicotineLimitMg: 20 })).toEqual({
      ok: true,
      value: { caffeineLimitMg: 400, nicotineLimitMg: 20 },
    });
  });

  it("accepts null as no limit", () => {
    expect(parseSettings({ caffeineLimitMg: null, nicotineLimitMg: null })).toEqual({
      ok: true,
      value: { caffeineLimitMg: null, nicotineLimitMg: null },
    });
  });

  it("accepts the edges of the range", () => {
    expect(parseSettings({ caffeineLimitMg: 1, nicotineLimitMg: 200 }).ok).toBe(true);
    expect(parseSettings({ caffeineLimitMg: 2000, nicotineLimitMg: 1 }).ok).toBe(true);
  });

  it("rejects limits outside the range of each substance", () => {
    expect(parseSettings({ caffeineLimitMg: 2001, nicotineLimitMg: 201 })).toEqual({
      ok: false,
      errors: { caffeineLimitMg: "Limiit peab olema 1–2000 mg.", nicotineLimitMg: "Limiit peab olema 1–200 mg." },
    });
    expect(parseSettings({ caffeineLimitMg: 0, nicotineLimitMg: null }).ok).toBe(false);
    expect(parseSettings({ caffeineLimitMg: -5, nicotineLimitMg: null }).ok).toBe(false);
  });

  it("rejects values that are not whole numbers", () => {
    for (const bad of [12.5, "400", Number.NaN, Number.POSITIVE_INFINITY, true, {}]) {
      const result = parseSettings({ caffeineLimitMg: bad, nicotineLimitMg: null });
      expect(result.ok, String(bad)).toBe(false);
      expect(!result.ok && result.errors.caffeineLimitMg).toMatch(/täisarv/);
    }
  });

  it("rejects a missing field instead of clearing the limit", () => {
    const result = parseSettings({ caffeineLimitMg: 400 });
    expect(result.ok).toBe(false);
    expect(!result.ok && Object.keys(result.errors)).toEqual(["nicotineLimitMg"]);
  });

  it("rejects input that is not an object", () => {
    expect(parseSettings(null).ok).toBe(false);
    expect(parseSettings("400").ok).toBe(false);
  });

  it("ignores extra fields like a user id", () => {
    const result = parseSettings({ caffeineLimitMg: 400, nicotineLimitMg: null, user_id: "someone-else" });
    expect(result).toEqual({ ok: true, value: { caffeineLimitMg: 400, nicotineLimitMg: null } });
  });
});
