import { describe, expect, it } from "vitest";
import { estimateInBody, remainingFraction, type Dose } from "@/lib/intake/decay";

// Fixed UTC times keep the tests independent of the machine's time zone.
const at = (time: string) => new Date(`2026-11-24T${time}:00Z`);
const dose = (amountMg: number, time: string): Dose => ({ amountMg, takenAt: at(time) });

describe("remainingFraction", () => {
  it("is 1 right after the dose", () => {
    expect(remainingFraction(0, 5)).toBe(1);
  });

  it("halves after each half-life", () => {
    expect(remainingFraction(5, 5)).toBeCloseTo(0.5);
    expect(remainingFraction(10, 5)).toBeCloseTo(0.25);
    expect(remainingFraction(2.5, 5)).toBeCloseTo(Math.SQRT1_2);
  });

  it("is 0 for a dose that has not been taken yet", () => {
    expect(remainingFraction(-1, 5)).toBe(0);
    expect(remainingFraction(Number.NaN, 5)).toBe(0);
  });

  it("rejects a half-life that is not positive", () => {
    expect(() => remainingFraction(1, 0)).toThrow(RangeError);
    expect(() => remainingFraction(1, -2)).toThrow(RangeError);
    expect(() => remainingFraction(1, Number.NaN)).toThrow(RangeError);
  });
});

describe("estimateInBody", () => {
  it("returns zeros and no share when nothing was taken", () => {
    expect(estimateInBody([], "caffeine", at("23:00"))).toEqual({
      takenMg: 0,
      remainingMg: 0,
      remainingShare: null,
    });
  });

  it("uses the caffeine half-life of 5 hours", () => {
    const result = estimateInBody([dose(160, "18:00")], "caffeine", at("23:00"));
    expect(result.takenMg).toBe(160);
    expect(result.remainingMg).toBeCloseTo(80);
    expect(result.remainingShare).toBeCloseTo(0.5);
  });

  it("uses the nicotine half-life of 2 hours", () => {
    const result = estimateInBody([dose(8, "21:00")], "nicotine", at("23:00"));
    expect(result.remainingMg).toBeCloseTo(4);
  });

  it("adds up several doses, each decaying from its own time", () => {
    // 80 mg at 08:00 -> 10 h -> 20 mg; 160 mg at 13:00 -> 5 h -> 80 mg
    const result = estimateInBody([dose(80, "08:00"), dose(160, "13:00")], "caffeine", at("18:00"));
    expect(result.takenMg).toBe(240);
    expect(result.remainingMg).toBeCloseTo(100);
    expect(result.remainingShare).toBeCloseTo(100 / 240);
  });

  it("counts a dose taken exactly at the estimate time in full", () => {
    const result = estimateInBody([dose(80, "23:00")], "caffeine", at("23:00"));
    expect(result.remainingMg).toBe(80);
    expect(result.remainingShare).toBe(1);
  });

  it("leaves out doses taken after the estimate time", () => {
    const result = estimateInBody([dose(80, "08:00"), dose(160, "20:00")], "caffeine", at("13:00"));
    expect(result.takenMg).toBe(80);
    expect(result.remainingMg).toBeCloseTo(40);
  });

  it("skips rows that cannot be real doses", () => {
    const doses: Dose[] = [
      dose(80, "08:00"),
      dose(0, "09:00"),
      dose(-50, "09:00"),
      dose(Number.NaN, "09:00"),
      { amountMg: 80, takenAt: new Date("not a date") },
    ];
    const result = estimateInBody(doses, "caffeine", at("13:00"));
    expect(result.takenMg).toBe(80);
    expect(result.remainingMg).toBeCloseTo(40);
  });
});
