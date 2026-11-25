import type { Substance } from "@/lib/intake/substances";

// One logged dose, as the app uses it. The Supabase `intakes` table has the
// same fields in snake_case (see src/lib/intake/rows.ts).
export type Intake = {
  id: string;
  substance: Substance;
  amountMg: number;
  // ISO 8601 string, e.g. "2026-11-25T14:05:00.000Z"
  takenAt: string;
  // What it was, e.g. "Espresso" or "Snus"
  label: string;
};

export type NewIntake = Omit<Intake, "id">;
