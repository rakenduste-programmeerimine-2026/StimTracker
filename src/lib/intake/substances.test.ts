import { describe, expect, it } from "vitest";
import { HALF_LIFE_HOURS, SUBSTANCES, isSubstance } from "@/lib/intake/substances";

describe("SUBSTANCES", () => {
  it("has a positive half-life for every substance", () => {
    for (const substance of SUBSTANCES) {
      expect(HALF_LIFE_HOURS[substance]).toBeGreaterThan(0);
    }
  });
});

describe("isSubstance", () => {
  it("accepts known substances", () => {
    expect(isSubstance("caffeine")).toBe(true);
    expect(isSubstance("nicotine")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isSubstance("alcohol")).toBe(false);
    expect(isSubstance("Caffeine")).toBe(false);
    expect(isSubstance("")).toBe(false);
    expect(isSubstance(null)).toBe(false);
    expect(isSubstance(1)).toBe(false);
  });
});
