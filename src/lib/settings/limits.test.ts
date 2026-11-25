import { describe, expect, it } from "vitest";
import { limitStatus } from "@/lib/settings/limits";

describe("limitStatus", () => {
  it("has no level without a limit", () => {
    expect(limitStatus(300, null)).toEqual({ level: "none", limitMg: null, share: null, leftMg: 0, overMg: 0 });
  });

  it("is ok well under the limit", () => {
    expect(limitStatus(100, 400)).toMatchObject({ level: "ok", share: 0.25, leftMg: 300, overMg: 0 });
  });

  it("warns from 80% of the limit", () => {
    expect(limitStatus(319, 400).level).toBe("ok");
    expect(limitStatus(320, 400).level).toBe("near");
    expect(limitStatus(400, 400)).toMatchObject({ level: "near", leftMg: 0 });
  });

  it("is over above the limit", () => {
    expect(limitStatus(420, 400)).toMatchObject({ level: "over", leftMg: 0, overMg: 20 });
  });
});
