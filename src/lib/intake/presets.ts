import type { Substance } from "@/lib/intake/substances";

// One-tap amounts for common products. These are typical values; real
// amounts vary by brand and size, so the manual form is there for the rest.
// Nicotine amounts are the approximate amount absorbed by the body, not the
// amount printed on the pack.

export type Preset = {
  id: string;
  label: string;
  substance: Substance;
  amountMg: number;
  // Short size hint shown under the label
  size: string;
};

export const PRESETS: readonly Preset[] = [
  { id: "espresso", label: "Espresso", substance: "caffeine", amountMg: 63, size: "1 shot" },
  { id: "coffee", label: "Kohv", substance: "caffeine", amountMg: 95, size: "tass, 240 ml" },
  { id: "energy-drink", label: "Energiajook", substance: "caffeine", amountMg: 80, size: "250 ml" },
  { id: "black-tea", label: "Must tee", substance: "caffeine", amountMg: 47, size: "tass, 240 ml" },
  { id: "cola", label: "Coca-Cola", substance: "caffeine", amountMg: 34, size: "330 ml" },
  { id: "snus", label: "Snus", substance: "nicotine", amountMg: 3, size: "1 portsjon" },
  { id: "cigarette", label: "Sigaret", substance: "nicotine", amountMg: 1, size: "1 tk" },
  { id: "vape", label: "Vape", substance: "nicotine", amountMg: 1, size: "~10 tõmmet" },
];
