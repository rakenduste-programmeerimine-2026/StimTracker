import { isSubstance } from "@/lib/intake/substances";
import type { Intake } from "@/lib/intake/types";
import type { ValidIntake } from "@/lib/intake/validation";

// Conversion between the `intakes` table (snake_case, see docs/DATABASE.md)
// and the app's Intake type (camelCase).

// The columns the app reads. The generated Row type has these and more, so
// it can be passed in as it is.
export type IntakeRow = {
  id: string;
  substance: string;
  amount_mg: number | string;
  taken_at: string;
  label: string;
};

// What the app sends on insert. user_id and created_at are filled in by the
// database, so they are never sent.
export type IntakeInsert = {
  substance: string;
  amount_mg: number;
  taken_at: string;
  label: string;
};

export const INTAKE_COLUMNS = "id, substance, amount_mg, taken_at, label";

// A row the app cannot show (unknown substance, broken amount or time)
// becomes null, so one bad row does not break the whole list.
export function rowToIntake(row: IntakeRow): Intake | null {
  const amountMg = Number(row.amount_mg);
  const takenAt = new Date(row.taken_at);
  if (!isSubstance(row.substance) || !Number.isFinite(amountMg) || Number.isNaN(takenAt.getTime())) {
    return null;
  }
  return {
    id: row.id,
    substance: row.substance,
    amountMg,
    takenAt: takenAt.toISOString(),
    label: row.label,
  };
}

export function rowsToIntakes(rows: readonly IntakeRow[]): Intake[] {
  return rows.map(rowToIntake).filter((intake): intake is Intake => intake !== null);
}

export function toInsertRow(intake: ValidIntake): IntakeInsert {
  return {
    substance: intake.substance,
    amount_mg: intake.amountMg,
    taken_at: intake.takenAt.toISOString(),
    label: intake.label,
  };
}
