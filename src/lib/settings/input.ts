import { SUBSTANCES } from "@/lib/intake/substances";
import { LIMIT_FIELD, LIMIT_RANGE, type Settings, type SettingsFailure } from "@/lib/settings/types";

// Server-side check of the daily limits. The settings form checks the same
// rules (src/lib/settings/form.ts), but a Server Action can be called with
// anything, so the server never trusts the browser.

export const INVALID_SETTINGS = "Limiidid on vigased. Paranda märgitud väljad.";

type FieldErrors = NonNullable<SettingsFailure["fieldErrors"]>;

export function parseSettings(input: unknown): { ok: true; value: Settings } | { ok: false; errors: FieldErrors } {
  const source = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const value: Settings = { caffeineLimitMg: null, nicotineLimitMg: null };
  const errors: FieldErrors = {};

  for (const substance of SUBSTANCES) {
    const field = LIMIT_FIELD[substance];
    const raw = source[field];
    // A missing field is not "no limit": the browser must send both.
    if (raw === null) continue;
    if (typeof raw !== "number" || !Number.isInteger(raw)) {
      errors[field] = "Sisesta täisarv milligrammides või jäta tühjaks.";
      continue;
    }
    const { min, max } = LIMIT_RANGE[substance];
    if (raw < min || raw > max) {
      errors[field] = `Limiit peab olema ${min}–${max} mg.`;
      continue;
    }
    value[field] = raw;
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value };
}
