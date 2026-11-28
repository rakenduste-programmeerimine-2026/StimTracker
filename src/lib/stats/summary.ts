import { SUBSTANCES, type Substance } from "@/lib/intake/substances";
import type { DayTotals } from "@/lib/stats/daily";

// One line of weekly statistics per substance, from dailyTotals().

export type WeekSummary = {
  totalMg: number;
  count: number;
  // Average per day over all days of the range, empty days included.
  averageMg: number;
  // Days with at least one intake.
  activeDays: number;
  // The day with the most milligrams (the earliest one on a tie), or null
  // when nothing was taken.
  peak: { day: Date; mg: number } | null;
};

export function summarizeWeek(days: readonly DayTotals[]): Record<Substance, WeekSummary> {
  return Object.fromEntries(SUBSTANCES.map((substance) => [substance, summarize(days, substance)])) as Record<
    Substance,
    WeekSummary
  >;
}

function summarize(days: readonly DayTotals[], substance: Substance): WeekSummary {
  let totalMg = 0;
  let count = 0;
  let activeDays = 0;
  let peak: WeekSummary["peak"] = null;

  for (const { day, totals } of days) {
    const { mg, count: dayCount } = totals[substance];
    totalMg += mg;
    count += dayCount;
    if (dayCount > 0) activeDays += 1;
    if (mg > 0 && (peak === null || mg > peak.mg)) peak = { day, mg };
  }

  return { totalMg, count, averageMg: days.length > 0 ? totalMg / days.length : 0, activeDays, peak };
}
