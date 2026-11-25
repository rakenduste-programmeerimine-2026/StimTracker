import { describe, expect, it } from "vitest";
import { startOfLocalDay, summarizeToday, todaysIntakes } from "@/lib/intake/today";
import type { Intake } from "@/lib/intake/types";

const at = (h: number, m = 0, day = 25) => new Date(2026, 10, day, h, m);
const intake = (id: string, substance: Intake["substance"], amountMg: number, takenAt: Date): Intake => ({
  id,
  substance,
  amountMg,
  takenAt: takenAt.toISOString(),
  label: id,
});

describe("startOfLocalDay", () => {
  it("returns local midnight", () => {
    expect(startOfLocalDay(at(15, 42))).toEqual(new Date(2026, 10, 25, 0, 0));
  });
});

describe("todaysIntakes", () => {
  const all = [
    intake("yesterday", "caffeine", 95, at(23, 30, 24)),
    intake("morning", "caffeine", 63, at(8)),
    intake("noon", "nicotine", 3, at(12)),
    intake("later", "caffeine", 95, at(18)),
  ];

  it("keeps only today's intakes up to now, newest first", () => {
    expect(todaysIntakes(all, at(15)).map((i) => i.id)).toEqual(["noon", "morning"]);
  });

  it("includes an intake taken exactly at midnight", () => {
    const midnight = intake("midnight", "caffeine", 10, at(0));
    expect(todaysIntakes([midnight], at(1)).map((i) => i.id)).toEqual(["midnight"]);
  });
});

describe("summarizeToday", () => {
  it("returns caffeine and nicotine even with no intakes", () => {
    expect(summarizeToday([], at(12))).toEqual([
      { substance: "caffeine", count: 0, takenMg: 0, remainingMg: 0, remainingShare: null },
      { substance: "nicotine", count: 0, takenMg: 0, remainingMg: 0, remainingShare: null },
    ]);
  });

  it("estimates what is left of today's doses", () => {
    const summary = summarizeToday(
      [intake("a", "caffeine", 160, at(10)), intake("b", "nicotine", 4, at(13)), intake("old", "caffeine", 500, at(9, 0, 24))],
      at(15),
    );
    const [caffeine, nicotine] = summary;
    expect(caffeine.count).toBe(1);
    expect(caffeine.takenMg).toBe(160);
    expect(caffeine.remainingMg).toBeCloseTo(80); // 5 h = one caffeine half-life
    expect(nicotine.remainingMg).toBeCloseTo(2); // 2 h = one nicotine half-life
  });
});
