import { HALF_LIFE_HOURS, type Substance } from "@/lib/intake/substances";

// Estimates how much of a substance is still in the body, using first-order
// elimination: after each half-life, half of what was left remains.
// Absorption is treated as instant, which is close enough for a daily
// overview and keeps the numbers easy to explain to the user.

const MS_PER_HOUR = 60 * 60 * 1000;

export type Dose = {
  amountMg: number;
  takenAt: Date;
};

export type BodyEstimate = {
  // Total of the doses taken up to the moment of the estimate.
  takenMg: number;
  // Part of takenMg that is estimated to still be in the body.
  remainingMg: number;
  // remainingMg / takenMg (0–1), or null when nothing has been taken yet.
  remainingShare: number | null;
};

// Share of a single dose (0–1) still in the body `hours` after taking it.
// A dose from the future (negative hours) has not been taken yet, so 0.
export function remainingFraction(hours: number, halfLifeHours: number): number {
  if (!Number.isFinite(halfLifeHours) || halfLifeHours <= 0) {
    throw new RangeError(`halfLifeHours must be a positive number, got ${halfLifeHours}`);
  }
  if (Number.isNaN(hours) || hours < 0) return 0;
  return 0.5 ** (hours / halfLifeHours);
}

// A row that cannot be a real dose is skipped, so one bad row does not
// break the whole estimate. The database also rejects such rows.
function isValidDose(dose: Dose): boolean {
  return Number.isFinite(dose.amountMg) && dose.amountMg > 0 && Number.isFinite(dose.takenAt.getTime());
}

// Estimate for one substance at the moment `at`, for example
// "at 23:00 about 40% of today's caffeine is still in your system".
// The caller picks the doses (for example today's), and they all count as the
// same substance. Doses taken after `at` are left out.
export function estimateInBody(doses: readonly Dose[], substance: Substance, at: Date): BodyEstimate {
  const halfLife = HALF_LIFE_HOURS[substance];
  const atMs = at.getTime();
  let takenMg = 0;
  let remainingMg = 0;

  for (const dose of doses) {
    if (!isValidDose(dose)) continue;
    const hours = (atMs - dose.takenAt.getTime()) / MS_PER_HOUR;
    if (hours < 0) continue;
    takenMg += dose.amountMg;
    remainingMg += dose.amountMg * remainingFraction(hours, halfLife);
  }

  return {
    takenMg,
    remainingMg,
    remainingShare: takenMg > 0 ? remainingMg / takenMg : null,
  };
}
