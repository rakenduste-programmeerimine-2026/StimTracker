"use server";

import { INVALID_SETTINGS, parseSettings } from "@/lib/settings/input";
import { SETTINGS_COLUMNS, rowToSettings, settingsDbErrorMessage, toSettingsRow } from "@/lib/settings/rows";
import type { GetSettingsResult, SaveSettingsResult, Settings } from "@/lib/settings/types";
import { createClient } from "@/lib/supabase/server";

// Server Actions for the daily limits (contract in src/lib/settings/types.ts).
// The signed-in user comes from the session cookie; row level security makes
// sure nobody can read or change another user's settings.

// The user's limits. A user who has never saved any has no row yet, which
// means no limits, not an error.
export async function getSettings(): Promise<GetSettingsResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("user_settings").select(SETTINGS_COLUMNS).maybeSingle();
  if (error) return { ok: false, message: settingsDbErrorMessage(error, "load") };

  return { ok: true, settings: rowToSettings(data) };
}

// Checks and saves both limits (null = no limit) and returns what was stored.
// The first save creates the row, later ones update it.
export async function saveSettings(input: Settings): Promise<SaveSettingsResult> {
  const parsed = parseSettings(input);
  if (!parsed.ok) return { ok: false, message: INVALID_SETTINGS, fieldErrors: parsed.errors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_settings")
    .upsert(toSettingsRow(parsed.value), { onConflict: "user_id" })
    .select(SETTINGS_COLUMNS)
    .single();
  if (error) return { ok: false, message: settingsDbErrorMessage(error, "save") };

  return { ok: true, settings: rowToSettings(data) };
}
