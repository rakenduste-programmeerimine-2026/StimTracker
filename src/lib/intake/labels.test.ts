import { describe, expect, it } from "vitest";
import { formatMg } from "@/lib/intake/labels";

describe("formatMg", () => {
  it("uses a decimal comma and at most one decimal", () => {
    expect(formatMg(63)).toBe("63 mg");
    expect(formatMg(1.5)).toBe("1,5 mg");
    expect(formatMg(12.345)).toBe("12,3 mg");
  });
});
