import { estimateInBody, type BodyEstimate } from "@/lib/intake/decay";
import { SUBSTANCES, type Substance } from "@/lib/intake/substances";
import type { Intake } from "@/lib/intake/types";

// Midnight of `now`'s day in the user's own time zone.
export function startOfLocalDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Intakes taken today up to `now`, newest first.
export function todaysIntakes(intakes: readonly Intake[], now: Date): Intake[] {
  const from = startOfLocalDay(now).getTime();
  const to = now.getTime();
  return intakes
    .filter((intake) => {
      const t = new Date(intake.takenAt).getTime();
      return t >= from && t <= to;
    })
    .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
}

export type SubstanceSummary = BodyEstimate & {
  substance: Substance;
  count: number;
};

// One summary per substance for the Today page, based on today's intakes.
export function summarizeToday(intakes: readonly Intake[], now: Date): SubstanceSummary[] {
  const today = todaysIntakes(intakes, now);
  return SUBSTANCES.map((substance) => {
    const doses = today
      .filter((intake) => intake.substance === substance)
      .map((intake) => ({ amountMg: intake.amountMg, takenAt: new Date(intake.takenAt) }));
    return { substance, count: doses.length, ...estimateInBody(doses, substance, now) };
  });
}
