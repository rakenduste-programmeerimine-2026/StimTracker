import { describe, expect, it } from "vitest";
import type { DayTotals } from "@/lib/stats/daily";
import { summarizeWeek } from "@/lib/stats/summary";

const day = (date: number, caffeineMg: number, caffeineCount: number, nicotineMg = 0, nicotineCount = 0): DayTotals => ({
  day: new Date(2026, 10, date),
  totals: {
    caffeine: { mg: caffeineMg, count: caffeineCount },
    nicotine: { mg: nicotineMg, count: nicotineCount },
  },
});

const week = [
  day(19, 0, 0),
  day(20, 190, 2, 8, 2),
  day(21, 95, 1),
  day(22, 0, 0, 4, 1),
  day(23, 300, 3),
  day(24, 0, 0),
  day(25, 115, 2),
];

describe("summarizeWeek", () => {
  it("adds up the week per substance", () => {
    const { caffeine, nicotine } = summarizeWeek(week);

    expect(caffeine.totalMg).toBe(700);
    expect(caffeine.count).toBe(8);
    expect(nicotine.totalMg).toBe(12);
    expect(nicotine.count).toBe(3);
  });

  it("averages over every day of the week, empty days included", () => {
    expect(summarizeWeek(week).caffeine.averageMg).toBe(100);
  });

  it("counts the days with intakes", () => {
    const { caffeine, nicotine } = summarizeWeek(week);

    expect(caffeine.activeDays).toBe(4);
    expect(nicotine.activeDays).toBe(2);
  });

  it("finds the day with the most milligrams", () => {
    expect(summarizeWeek(week).caffeine.peak).toEqual({ day: new Date(2026, 10, 23), mg: 300 });
  });

  it("keeps the earliest day on a tie", () => {
    expect(summarizeWeek([day(20, 95, 1), day(21, 95, 1)]).caffeine.peak?.day).toEqual(new Date(2026, 10, 20));
  });

  it("gives zeros and no peak for an empty week", () => {
    expect(summarizeWeek([day(19, 0, 0), day(20, 0, 0)]).nicotine).toEqual({
      totalMg: 0,
      count: 0,
      averageMg: 0,
      activeDays: 0,
      peak: null,
    });
  });

  it("does not divide by zero without days", () => {
    expect(summarizeWeek([]).caffeine.averageMg).toBe(0);
  });
});
