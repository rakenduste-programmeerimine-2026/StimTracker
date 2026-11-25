"use server";

import { INVALID_INPUT, parseIntakeId, parseNewIntake, parseTimeRange } from "@/lib/intake/input";
import {
  NOT_FOUND,
  intakeDbErrorMessage,
  type AddIntakeResult,
  type DeleteIntakeResult,
  type ListIntakesResult,
} from "@/lib/intake/results";
import { INTAKE_COLUMNS, rowToIntake, rowsToIntakes, toInsertRow } from "@/lib/intake/rows";
import type { NewIntake } from "@/lib/intake/types";
import { createClient } from "@/lib/supabase/server";

// Server Actions for logging intakes. Called from Client Components with
// plain objects, e.g. await addIntake({ substance, amountMg, takenAt, label }).
// The signed-in user comes from the session cookie; row level security makes
// sure nobody can read or change another user's rows.

// Saves one intake and returns it as stored (with its id, for undo).
export async function addIntake(input: NewIntake): Promise<AddIntakeResult> {
  const parsed = parseNewIntake(input, new Date());
  if (!parsed.ok) {
    return { ok: false, message: INVALID_INPUT, fieldErrors: parsed.errors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("intakes").insert(toInsertRow(parsed.value)).select(INTAKE_COLUMNS).single();
  if (error) return { ok: false, message: intakeDbErrorMessage(error, "insert") };

  const intake = rowToIntake(data);
  if (!intake) return { ok: false, message: intakeDbErrorMessage({ message: "unreadable row after insert" }, "insert") };
  return { ok: true, intake };
}

// Deletes one of the user's intakes, also used for "Võta tagasi" (undo).
export async function deleteIntake(id: string): Promise<DeleteIntakeResult> {
  const intakeId = parseIntakeId(id);
  if (!intakeId) return { ok: false, message: INVALID_INPUT };

  const supabase = await createClient();
  const { data, error } = await supabase.from("intakes").delete().eq("id", intakeId).select("id");
  if (error) return { ok: false, message: intakeDbErrorMessage(error, "delete") };

  // RLS hides other users' rows, so "not yours" and "already gone" both
  // look like zero deleted rows.
  if (!data || data.length === 0) return { ok: false, message: NOT_FOUND };
  return { ok: true };
}

// The user's intakes taken between `from` and `to` (ISO strings with a time
// zone, both included), newest first. The browser picks the range, because
// "today" starts at the user's own midnight (see startOfLocalDay in
// src/lib/intake/today.ts); the server runs in UTC. At most 35 days.
export async function listIntakes(from: string, to: string): Promise<ListIntakesResult> {
  const range = parseTimeRange(from, to);
  if (!range) return { ok: false, message: INVALID_INPUT };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("intakes")
    .select(INTAKE_COLUMNS)
    .gte("taken_at", range.from.toISOString())
    .lte("taken_at", range.to.toISOString())
    .order("taken_at", { ascending: false });
  if (error) return { ok: false, message: intakeDbErrorMessage(error, "list") };

  return { ok: true, intakes: rowsToIntakes(data ?? []) };
}
