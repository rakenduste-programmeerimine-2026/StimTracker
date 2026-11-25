import { describe, expect, it } from "vitest";
import { getSettings, saveSettings } from "@/app/settings/actions";
import { SETTINGS_UNAVAILABLE } from "@/lib/settings/types";

// The placeholder must fail safely until the backend (#34) replaces it.
describe("settings actions placeholder", () => {
  it("answers that settings are not available yet", async () => {
    expect(await getSettings()).toEqual({ ok: false, message: SETTINGS_UNAVAILABLE });
    expect(await saveSettings({ caffeineLimitMg: 400, nicotineLimitMg: null })).toEqual({
      ok: false,
      message: SETTINGS_UNAVAILABLE,
    });
  });
});
