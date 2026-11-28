import { SUBSTANCES, type Substance } from "@/lib/intake/substances";
import type { DayTotals } from "@/lib/stats/daily";

// How many days of the week went over the daily limit. The limits come from
// the user's settings (user_settings); null means no limit.

export type DailyLimits = Record<Substance, number | null>;

export type LimitDays = {
  limitMg: number;
  // Days with more than the limit (exactly at the limit is not over).
  overDays: number;
  // Local midnight of each of those days, oldest first.
  days: Date[];
};

// Per substance: the days over the limit, or null when there is no limit.
export function daysOverLimit(days: readonly DayTotals[], limits: DailyLimits): Record<Substance, LimitDays | null> {
  return Object.fromEntries(
    SUBSTANCES.map((substance) => {
      const limitMg = limits[substance];
      if (limitMg === null || !(limitMg > 0)) return [substance, null];
      const over = days.filter((entry) => entry.totals[substance].mg > limitMg).map((entry) => entry.day);
      return [substance, { limitMg, overDays: over.length, days: over }];
    }),
  ) as Record<Substance, LimitDays | null>;
}
