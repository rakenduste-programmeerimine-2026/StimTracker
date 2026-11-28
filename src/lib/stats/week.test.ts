import { afterEach, describe, expect, it, vi } from "vitest";
import { WEEK_DAYS, addLocalDays, weekRange } from "@/lib/stats/week";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("addLocalDays", () => {
  it("moves to local midnight of another day", () => {
    expect(addLocalDays(new Date(2026, 10, 25, 15, 30), -2)).toEqual(new Date(2026, 10, 23));
  });

  it("crosses month and year ends", () => {
    expect(addLocalDays(new Date(2026, 0, 2), -3)).toEqual(new Date(2025, 11, 30));
  });
});

describe("weekRange", () => {
  const now = new Date(2026, 10, 25, 15, 30);

  it("covers today and the 6 days before it", () => {
    const week = weekRange(now);

    expect(week.days).toHaveLength(WEEK_DAYS);
    expect(week.days[0]).toEqual(new Date(2026, 10, 19));
    expect(week.days[6]).toEqual(new Date(2026, 10, 25));
  });

  it("starts at local midnight of the first day and ends now", () => {
    const week = weekRange(now);

    expect(week.from).toEqual(new Date(2026, 10, 19));
    expect(week.to).toBe(now);
  });

  it("keeps every day at midnight across a daylight saving change", () => {
    // Estonia moves the clock forward on 29 March 2026.
    vi.stubEnv("TZ", "Europe/Tallinn");

    const week = weekRange(new Date(2026, 3, 1, 12));

    expect(week.days.map((day) => [day.getDate(), day.getHours()])).toEqual([
      [26, 0], [27, 0], [28, 0], [29, 0], [30, 0], [31, 0], [1, 0],
    ]);
  });
});
