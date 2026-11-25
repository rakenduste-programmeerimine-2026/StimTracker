import type { Substance } from "@/lib/intake/substances";

// Display names in Estonian.
export const SUBSTANCE_LABEL: Record<Substance, string> = {
  caffeine: "Kofeiin",
  nicotine: "Nikotiin",
};

// "63 mg", "1,5 mg": one decimal at most, Estonian decimal comma.
export function formatMg(mg: number): string {
  return `${mg.toLocaleString("et-EE", { maximumFractionDigits: 1 })} mg`;
}
