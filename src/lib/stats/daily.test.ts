import { describe, expect, it } from "vitest";
import type { Intake } from "@/lib/intake/types";
import { dailyTotals } from "@/lib/stats/daily";
import { weekRange } from "@/lib/stats/week";

const at = (day: number, h: number, m = 0) => new Date(2026, 10, day, h, m);
const intake = (substance: Intake["substance"], amountMg: number, takenAt: Date): Intake => ({
  id: `${substance}-${takenAt.getTime()}`,
  substance,
  amountMg,
  takenAt: takenAt.toISOString(),
  label: substance,
});

const { days } = weekRange(at(25, 15));

describe("dailyTotals", () => {
  it("adds up each substance per day", () => {
    const totals = dailyTotals(
      [intake("caffeine", 95, at(25, 8)), intake("caffeine", 63, at(25, 13)), intake("nicotine", 4, at(25, 9))],
      days,
    );

    expect(totals[6].totals).toEqual({ caffeine: { mg: 158, count: 2 }, nicotine: { mg: 4, count: 1 } });
  });

  it("returns every day of the week in order, with zeros on empty days", () => {
    const totals = dailyTotals([intake("caffeine", 95, at(21, 10))], days);

    expect(totals.map((entry) => entry.day)).toEqual(days);
    expect(totals[2].totals.caffeine).toEqual({ mg: 95, count: 1 });
    expect(totals[0].totals).toEqual({ caffeine: { mg: 0, count: 0 }, nicotine: { mg: 0, count: 0 } });
  });

  it("splits days at local midnight", () => {
    const totals = dailyTotals([intake("caffeine", 80, at(22, 23, 59)), intake("caffeine", 40, at(23, 0, 0))], days);

    expect(totals[3].totals.caffeine.mg).toBe(80);
    expect(totals[4].totals.caffeine.mg).toBe(40);
  });

  it("leaves out intakes from outside the days", () => {
    const totals = dailyTotals([intake("caffeine", 95, at(18, 23)), intake("nicotine", 4, at(26, 1))], days);

    expect(totals.every((entry) => entry.totals.caffeine.count === 0 && entry.totals.nicotine.count === 0)).toBe(true);
  });

  it("returns an empty list for no days", () => {
    expect(dailyTotals([intake("caffeine", 95, at(25, 8))], [])).toEqual([]);
  });
});
