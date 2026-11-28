import { startOfLocalDay } from "@/lib/intake/today";
import { SUBSTANCES, type Substance } from "@/lib/intake/substances";
import type { Intake } from "@/lib/intake/types";

// Intakes added up per local day and substance.

export type SubstanceTotal = {
  mg: number;
  count: number;
};

export type DayTotals = {
  // Local midnight of the day.
  day: Date;
  totals: Record<Substance, SubstanceTotal>;
};

function emptyTotals(): Record<Substance, SubstanceTotal> {
  return Object.fromEntries(SUBSTANCES.map((substance) => [substance, { mg: 0, count: 0 }])) as Record<
    Substance,
    SubstanceTotal
  >;
}

// One entry per day in `days` (local midnights, e.g. weekRange().days), in the
// same order. A day without intakes gets zeros, so a chart has no gaps.
// Intakes on other days are left out.
export function dailyTotals(intakes: readonly Intake[], days: readonly Date[]): DayTotals[] {
  const result = days.map((day) => ({ day, totals: emptyTotals() }));
  const byDay = new Map(result.map((entry) => [entry.day.getTime(), entry]));

  for (const intake of intakes) {
    const entry = byDay.get(startOfLocalDay(new Date(intake.takenAt)).getTime());
    if (!entry) continue;
    const total = entry.totals[intake.substance];
    total.mg += intake.amountMg;
    total.count += 1;
  }

  return result;
}
