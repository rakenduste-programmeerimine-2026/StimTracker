import { describe, expect, it } from "vitest";
import { compareWeeks, previousWeekRange } from "@/lib/stats/compare";
import type { WeekSummary } from "@/lib/stats/summary";
import { weekRange } from "@/lib/stats/week";

const summary = (totalMg: number): WeekSummary => ({
  totalMg,
  count: totalMg > 0 ? 1 : 0,
  averageMg: totalMg / 7,
  activeDays: totalMg > 0 ? 1 : 0,
  peak: null,
});

describe("previousWeekRange", () => {
  const week = weekRange(new Date(2026, 10, 25, 15, 30));
  const previous = previousWeekRange(week);

  it("covers the 7 days before the week", () => {
    expect(previous.days).toHaveLength(7);
    expect(previous.days[0]).toEqual(new Date(2026, 10, 12));
    expect(previous.days[6]).toEqual(new Date(2026, 10, 18));
    expect(previous.from).toEqual(new Date(2026, 10, 12));
  });

  it("ends just before the week starts, so no intake is counted twice", () => {
    expect(previous.to.getTime()).toBe(week.from.getTime() - 1);
  });

  it("fits both weeks into one list request", () => {
    const days = (week.to.getTime() - previous.from.getTime()) / (24 * 60 * 60 * 1000);
    expect(days).toBeLessThanOrEqual(35);
  });
});

describe("compareWeeks", () => {
  it("gives the change in milligrams and as a share", () => {
    const change = compareWeeks({ caffeine: summary(1000), nicotine: summary(30) }, { caffeine: summary(800), nicotine: summary(40) });

    expect(change.caffeine).toEqual({ diffMg: 200, share: 0.25 });
    expect(change.nicotine).toEqual({ diffMg: -10, share: -0.25 });
  });

  it("gives no share when nothing was taken the week before", () => {
    const change = compareWeeks({ caffeine: summary(300), nicotine: summary(0) }, { caffeine: summary(0), nicotine: summary(0) });

    expect(change.caffeine).toEqual({ diffMg: 300, share: null });
    expect(change.nicotine).toEqual({ diffMg: 0, share: null });
  });

  it("shows a full stop as -100%", () => {
    const change = compareWeeks({ caffeine: summary(0), nicotine: summary(0) }, { caffeine: summary(500), nicotine: summary(0) });

    expect(change.caffeine).toEqual({ diffMg: -500, share: -1 });
  });
});
