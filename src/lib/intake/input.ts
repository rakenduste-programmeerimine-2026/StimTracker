import { validateIntake, type FieldErrors, type ValidationResult } from "@/lib/intake/validation";

// Checks what the browser sends to the intake Server Actions. The browser
// can send anything, so nothing is trusted: the same rules as the form
// (src/lib/intake/validation.ts) run again on the server.

export const INVALID_INPUT = "Andmed on vigased. Värskenda lehte ja proovi uuesti.";

// Longest range one list request may ask for: a week of stats plus margin.
export const MAX_RANGE_DAYS = 35;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Strict ISO 8601 with a time zone, e.g. "2026-11-25T14:05:00.000Z" or
// "2026-11-25T16:05:00+02:00". A time without a zone would be read in the
// server's zone (UTC), which is exactly the mistake to avoid.
const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

export function parseIsoTime(value: unknown): Date | null {
  if (typeof value !== "string" || !ISO_WITH_ZONE.test(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// A new intake as the UI sends it: { substance, amountMg, takenAt, label },
// with takenAt as an ISO string (the Intake type without id).
export function parseNewIntake(input: unknown, now: Date): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: {} };
  }
  const v = input as Record<string, unknown>;
  const errors: FieldErrors = {};

  if (typeof v.amountMg !== "number" || !Number.isFinite(v.amountMg)) {
    errors.amountMg = "Kogus peab olema number.";
  } else if (v.amountMg <= 0) {
    // Checked here because the form's parser does not read a minus sign.
    errors.amountMg = "Kogus peab olema suurem kui 0.";
  }
  if (parseIsoTime(v.takenAt) === null) {
    errors.takenAt = "Kellaaeg ei ole õiges vormingus.";
  }
  if (v.label !== undefined && typeof v.label !== "string") {
    errors.label = "Nimetus peab olema tekst.";
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  // Same checks as the form, so both give the same messages.
  return validateIntake(
    {
      substance: typeof v.substance === "string" ? v.substance : "",
      amountMg: String(v.amountMg),
      takenAt: v.takenAt as string,
      label: (v.label as string | undefined) ?? "",
    },
    now,
  );
}

export type TimeRange = { from: Date; to: Date };

// Range for listing intakes. The browser sends it because "today" starts
// at the user's own midnight, which the server (UTC) cannot know.
export function parseTimeRange(from: unknown, to: unknown): TimeRange | null {
  const start = parseIsoTime(from);
  const end = parseIsoTime(to);
  if (!start || !end) return null;
  const span = end.getTime() - start.getTime();
  if (span < 0 || span > MAX_RANGE_DAYS * MS_PER_DAY) return null;
  return { from: start, to: end };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseIntakeId(value: unknown): string | null {
  return typeof value === "string" && UUID.test(value) ? value.toLowerCase() : null;
}
