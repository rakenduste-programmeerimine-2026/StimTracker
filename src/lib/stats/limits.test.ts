import { describe, expect, it } from "vitest";
import type { DayTotals } from "@/lib/stats/daily";
import { daysOverLimit } from "@/lib/stats/limits";

const day = (date: number, caffeineMg: number, nicotineMg = 0): DayTotals => ({
  day: new Date(2026, 10, date),
  totals: {
    caffeine: { mg: caffeineMg, count: caffeineMg > 0 ? 1 : 0 },
    nicotine: { mg: nicotineMg, count: nicotineMg > 0 ? 1 : 0 },
  },
});

const week = [day(19, 450), day(20, 400), day(21, 0, 25), day(22, 401, 10)];

describe("daysOverLimit", () => {
  it("lists the days over each limit", () => {
    const result = daysOverLimit(week, { caffeine: 400, nicotine: 20 });

    expect(result.caffeine).toEqual({ limitMg: 400, overDays: 2, days: [new Date(2026, 10, 19), new Date(2026, 10, 22)] });
    expect(result.nicotine).toEqual({ limitMg: 20, overDays: 1, days: [new Date(2026, 10, 21)] });
  });

  it("does not count a day exactly at the limit", () => {
    expect(daysOverLimit([day(20, 400)], { caffeine: 400, nicotine: null }).caffeine?.overDays).toBe(0);
  });

  it("gives null for a substance without a limit", () => {
    expect(daysOverLimit(week, { caffeine: null, nicotine: 20 }).caffeine).toBeNull();
  });

  it("ignores a limit that is not positive", () => {
    expect(daysOverLimit(week, { caffeine: 0, nicotine: Number.NaN })).toEqual({ caffeine: null, nicotine: null });
  });

  it("gives zero days for a week under the limit", () => {
    expect(daysOverLimit(week, { caffeine: 1000, nicotine: 100 }).caffeine).toEqual({ limitMg: 1000, overDays: 0, days: [] });
  });
});
