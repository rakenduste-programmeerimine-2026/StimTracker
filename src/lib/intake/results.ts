import type { Intake } from "@/lib/intake/types";
import type { FieldErrors } from "@/lib/intake/validation";

// What the intake Server Actions return. Messages are in Estonian and can be
// shown to the user as they are.

export type Failure = { ok: false; message: string; fieldErrors?: FieldErrors };

export type AddIntakeResult = { ok: true; intake: Intake } | Failure;
export type DeleteIntakeResult = { ok: true } | Failure;
export type ListIntakesResult = { ok: true; intakes: Intake[] } | Failure;

export const NOT_SIGNED_IN = "Logi sisse, et tarbimisi salvestada ja näha.";
export const SAVE_FAILED = "Salvestamine ebaõnnestus. Proovi uuesti.";
export const NOT_FOUND = "Tarbimist ei leitud. Võib-olla on see juba kustutatud.";

// Postgres / PostgREST error codes listed in docs/DATABASE.md.
const INSUFFICIENT_PRIVILEGE = "42501";
const CHECK_VIOLATION = "23514";
const NOT_NULL_VIOLATION = "23502";

// The raw database error is logged on the server, never shown to the user.
export function intakeDbErrorMessage(error: { code?: string; message: string }, context: string): string {
  console.error(`[intake] ${context} failed`, error.code, error.message);
  if (error.code === INSUFFICIENT_PRIVILEGE) return NOT_SIGNED_IN;
  if (error.code === CHECK_VIOLATION || error.code === NOT_NULL_VIOLATION) {
    return "Mõni väli on vigane. Kontrolli kogust, nimetust ja kellaaega.";
  }
  return SAVE_FAILED;
}
