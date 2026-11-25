import type { Substance } from "@/lib/intake/substances";

// One logged dose. Same shape the Supabase table will have, so the mock
// store can later be swapped for the database without touching the UI.
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
