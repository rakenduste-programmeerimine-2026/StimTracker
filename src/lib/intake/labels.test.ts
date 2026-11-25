import { describe, expect, it } from "vitest";
import { formatAmount, formatMg } from "@/lib/intake/labels";

describe("formatMg", () => {
  it("uses a decimal comma and at most one decimal for small amounts", () => {
    expect(formatMg(1.5)).toBe("1,5 mg");
    expect(formatMg(2.345)).toBe("2,3 mg");
    expect(formatMg(0)).toBe("0 mg");
  });

  it("rounds amounts from 10 mg up to whole milligrams", () => {
    expect(formatMg(63)).toBe("63 mg");
    expect(formatMg(209.7)).toBe("210 mg");
    expect(formatMg(12.345)).toBe("12 mg");
  });
});

describe("formatAmount", () => {
  it("returns the number without the unit", () => {
    expect(formatAmount(209.7)).toBe("210");
    expect(formatAmount(1.5)).toBe("1,5");
  });
});
