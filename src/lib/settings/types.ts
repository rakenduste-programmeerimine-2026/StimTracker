import type { Substance } from "@/lib/intake/substances";

// Contract between the daily limit UI and the backend Server Actions in
// src/app/settings/actions.ts (#34). Same style as the intake actions: success
// carries the data, failure an Estonian message that the UI shows as it is.

// Daily limits in milligrams. null means "no limit". Stored in the
// `user_settings` table (caffeine_limit_mg, nicotine_limit_mg).
export type Settings = {
  caffeineLimitMg: number | null;
  nicotineLimitMg: number | null;
};

export type SettingsField = keyof Settings;

export type SettingsFailure = {
  ok: false;
  message: string;
  fieldErrors?: Partial<Record<SettingsField, string>>;
};

// A user without a saved row gets NO_LIMITS, not an error.
export type GetSettingsResult = { ok: true; settings: Settings } | SettingsFailure;
export type SaveSettingsResult = { ok: true; settings: Settings } | SettingsFailure;

// What the placeholder actions answer until the backend (#34) is in.
// ("use server" files may only export async functions, so it lives here.)
export const SETTINGS_UNAVAILABLE = "Päevalimiidi salvestamine pole veel valmis.";

export const NO_LIMITS: Settings = { caffeineLimitMg: null, nicotineLimitMg: null };

// Allowed values, the same as the checks on the user_settings table.
export const LIMIT_RANGE: Record<Substance, { min: number; max: number }> = {
  caffeine: { min: 1, max: 2000 },
  nicotine: { min: 1, max: 200 },
};

export const LIMIT_FIELD: Record<Substance, SettingsField> = {
  caffeine: "caffeineLimitMg",
  nicotine: "nicotineLimitMg",
};

export function limitFor(settings: Settings, substance: Substance): number | null {
  return settings[LIMIT_FIELD[substance]];
}
