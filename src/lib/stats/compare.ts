import { SUBSTANCES, type Substance } from "@/lib/intake/substances";
import type { WeekSummary } from "@/lib/stats/summary";
import { WEEK_DAYS, addLocalDays, type WeekRange } from "@/lib/stats/week";

// This week against the week before it. Both weeks together are 14 days, so
// one listIntakes(previous.from, current.to) call loads them (max 35 days).

// The 7 full days just before `week`. It ends 1 ms before `week` starts,
// because listIntakes includes both ends of a range.
export function previousWeekRange(week: WeekRange): WeekRange {
  const days = Array.from({ length: WEEK_DAYS }, (_, i) => addLocalDays(week.from, i - WEEK_DAYS));
  return { from: days[0], to: new Date(week.from.getTime() - 1), days };
}

export type WeekChange = {
  // This week minus the week before, in milligrams.
  diffMg: number;
  // The change as a share of the week before (0.25 = 25% more), or null
  // when nothing was taken the week before.
  share: number | null;
};

export function compareWeeks(
  current: Record<Substance, WeekSummary>,
  previous: Record<Substance, WeekSummary>,
): Record<Substance, WeekChange> {
  return Object.fromEntries(
    SUBSTANCES.map((substance) => {
      const now = current[substance].totalMg;
      const before = previous[substance].totalMg;
      return [substance, { diffMg: now - before, share: before > 0 ? (now - before) / before : null }];
    }),
  ) as Record<Substance, WeekChange>;
}
