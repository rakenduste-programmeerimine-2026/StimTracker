import { startOfLocalDay } from "@/lib/intake/today";

// The week the statistics show: today and the 6 days before it, in the
// user's own time zone. Computed in the browser, because the server runs in
// UTC (see docs/DATABASE.md); listIntakes(from, to) then loads the range.

export const WEEK_DAYS = 7;

export type WeekRange = {
  // Local midnight of the first day.
  from: Date;
  // The moment the range ends (now for the current week).
  to: Date;
  // Local midnight of every day, oldest first.
  days: Date[];
};

// Local midnight `offset` days from `day`. Built from the calendar date, not
// by adding 24 hours, so a daylight saving change does not shift the day.
export function addLocalDays(day: Date, offset: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + offset);
}

export function weekRange(now: Date): WeekRange {
  const today = startOfLocalDay(now);
  const days = Array.from({ length: WEEK_DAYS }, (_, i) => addLocalDays(today, i - (WEEK_DAYS - 1)));
  return { from: days[0], to: now, days };
}
