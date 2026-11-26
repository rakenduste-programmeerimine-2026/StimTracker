import { NO_LIMITS, type Settings } from "@/lib/settings/types";
import type { Database } from "@/types/database.types";

// Conversion between the `user_settings` table (snake_case, see
// docs/DATABASE.md) and the app's Settings type (camelCase), and the
// messages for its database errors.

type SettingsTable = Database["public"]["Tables"]["user_settings"];

export type SettingsRow = Pick<SettingsTable["Row"], "caffeine_limit_mg" | "nicotine_limit_mg">;

// What the app sends on upsert. user_id and updated_at are filled in by the
// database, so they are never sent.
export type SettingsUpsert = Required<Pick<SettingsTable["Insert"], "caffeine_limit_mg" | "nicotine_limit_mg">>;

export const SETTINGS_COLUMNS = "caffeine_limit_mg, nicotine_limit_mg";

export const SETTINGS_NOT_SIGNED_IN = "Logi sisse, et päevalimiite salvestada ja näha.";
export const SETTINGS_SAVE_FAILED = "Päevalimiitide salvestamine ebaõnnestus. Proovi uuesti.";
export const SETTINGS_LOAD_FAILED = "Päevalimiitide laadimine ebaõnnestus. Proovi uuesti.";

// A missing limit or one the app cannot read means "no limit".
function toLimit(mg: number | string | null): number | null {
  if (mg === null) return null;
  const value = Number(mg);
  return Number.isFinite(value) && value > 0 ? value : null;
}

// No row yet means the user has not set any limits.
export function rowToSettings(row: SettingsRow | null): Settings {
  if (!row) return { ...NO_LIMITS };
  return { caffeineLimitMg: toLimit(row.caffeine_limit_mg), nicotineLimitMg: toLimit(row.nicotine_limit_mg) };
}

export function toSettingsRow(settings: Settings): SettingsUpsert {
  return { caffeine_limit_mg: settings.caffeineLimitMg, nicotine_limit_mg: settings.nicotineLimitMg };
}

// Postgres / PostgREST error codes listed in docs/DATABASE.md.
const INSUFFICIENT_PRIVILEGE = "42501";
const CHECK_VIOLATION = "23514";

// The raw database error is logged on the server, never shown to the user.
export function settingsDbErrorMessage(error: { code?: string; message: string }, context: "load" | "save"): string {
  console.error(`[settings] ${context} failed`, error.code, error.message);
  if (error.code === INSUFFICIENT_PRIVILEGE) return SETTINGS_NOT_SIGNED_IN;
  if (error.code === CHECK_VIOLATION) return "Limiit on lubatud vahemikust väljas.";
  return context === "load" ? SETTINGS_LOAD_FAILED : SETTINGS_SAVE_FAILED;
}
