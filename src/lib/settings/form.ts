import { parseAmount } from "@/lib/intake/validation";
import { SUBSTANCES, type Substance } from "@/lib/intake/substances";
import { LIMIT_FIELD, LIMIT_RANGE, type Settings, type SettingsField } from "@/lib/settings/types";

// The settings form: text fields in, Settings out. An empty field means
// "no limit". The backend checks the same rules again (#34).

export type LimitFormValues = Record<SettingsField, string>;
export type LimitFormErrors = Partial<Record<SettingsField, string>>;

export function settingsToForm(settings: Settings): LimitFormValues {
  const text = (mg: number | null) => (mg === null ? "" : String(mg));
  return { caffeineLimitMg: text(settings.caffeineLimitMg), nicotineLimitMg: text(settings.nicotineLimitMg) };
}

function parseLimit(raw: string, substance: Substance): { value: number | null } | { error: string } {
  if (raw.trim() === "") return { value: null };
  const { min, max } = LIMIT_RANGE[substance];
  const mg = parseAmount(raw);
  if (Number.isNaN(mg) || !Number.isInteger(mg)) {
    return { error: "Sisesta täisarv milligrammides või jäta tühjaks." };
  }
  if (mg < min || mg > max) return { error: `Limiit peab olema ${min}–${max} mg.` };
  return { value: mg };
}

export function parseSettingsForm(
  values: LimitFormValues,
): { ok: true; settings: Settings } | { ok: false; errors: LimitFormErrors } {
  const errors: LimitFormErrors = {};
  const settings: Settings = { caffeineLimitMg: null, nicotineLimitMg: null };
  for (const substance of SUBSTANCES) {
    const field = LIMIT_FIELD[substance];
    const result = parseLimit(values[field], substance);
    if ("error" in result) errors[field] = result.error;
    else settings[field] = result.value;
  }
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, settings };
}
