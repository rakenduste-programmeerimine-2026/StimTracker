"use server";

import { SETTINGS_UNAVAILABLE, type GetSettingsResult, type SaveSettingsResult, type Settings } from "@/lib/settings/types";

// PLACEHOLDER for the backend. The daily limit UI already calls these two
// Server Actions; the real versions read and upsert the `user_settings`
// table (docs/DATABASE.md) and come with issue #34. Until then
// they only answer that settings are not available, so nothing breaks.
//
// Contract (src/lib/settings/types.ts):
// - getSettings(): the signed-in user's limits; no row yet -> NO_LIMITS
// - saveSettings(input): check the limits on the server, upsert, return
//   what was stored; on bad input { ok: false, message, fieldErrors }

export async function getSettings(): Promise<GetSettingsResult> {
  return { ok: false, message: SETTINGS_UNAVAILABLE };
}

export async function saveSettings(input: Settings): Promise<SaveSettingsResult> {
  void input;
  return { ok: false, message: SETTINGS_UNAVAILABLE };
}
