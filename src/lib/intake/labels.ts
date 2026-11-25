import type { Substance } from "@/lib/intake/substances";

// Display names in Estonian.
export const SUBSTANCE_LABEL: Record<Substance, string> = {
  caffeine: "Kofeiin",
  nicotine: "Nikotiin",
};

// "63 mg", "1,5 mg": whole milligrams from 10 mg up, otherwise one decimal
// at most (nicotine amounts are small). Estonian decimal comma.
export function formatMg(mg: number): string {
  return `${formatAmount(mg)} mg`;
}

// Just the number, for when "mg" is shown separately in a smaller size.
export function formatAmount(mg: number): string {
  const digits = Math.abs(mg) >= 10 ? 0 : 1;
  return mg.toLocaleString("et-EE", { maximumFractionDigits: digits });
}
