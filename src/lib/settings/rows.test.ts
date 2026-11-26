import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SETTINGS_LOAD_FAILED,
  SETTINGS_NOT_SIGNED_IN,
  SETTINGS_SAVE_FAILED,
  rowToSettings,
  settingsDbErrorMessage,
  toSettingsRow,
} from "@/lib/settings/rows";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("rowToSettings", () => {
  it("converts a stored row", () => {
    expect(rowToSettings({ caffeine_limit_mg: 400, nicotine_limit_mg: null })).toEqual({
      caffeineLimitMg: 400,
      nicotineLimitMg: null,
    });
  });

  it("gives no limits when the user has no row yet", () => {
    expect(rowToSettings(null)).toEqual({ caffeineLimitMg: null, nicotineLimitMg: null });
  });

  it("reads a numeric column that arrives as a string", () => {
    const row = { caffeine_limit_mg: "250", nicotine_limit_mg: "12" } as unknown as Parameters<typeof rowToSettings>[0];
    expect(rowToSettings(row)).toEqual({ caffeineLimitMg: 250, nicotineLimitMg: 12 });
  });

  it("treats an unreadable limit as no limit", () => {
    const row = { caffeine_limit_mg: "abc", nicotine_limit_mg: 0 } as unknown as Parameters<typeof rowToSettings>[0];
    expect(rowToSettings(row)).toEqual({ caffeineLimitMg: null, nicotineLimitMg: null });
  });
});

describe("toSettingsRow", () => {
  it("sends only the limit columns", () => {
    expect(toSettingsRow({ caffeineLimitMg: 400, nicotineLimitMg: null })).toEqual({
      caffeine_limit_mg: 400,
      nicotine_limit_mg: null,
    });
  });
});

describe("settingsDbErrorMessage", () => {
  it("asks to sign in when row level security refuses", () => {
    expect(settingsDbErrorMessage({ code: "42501", message: "permission denied" }, "save")).toBe(SETTINGS_NOT_SIGNED_IN);
  });

  it("explains a limit the table does not accept", () => {
    expect(settingsDbErrorMessage({ code: "23514", message: "violates check" }, "save")).toMatch(/vahemikust/);
  });

  it("never shows the raw message for other errors", () => {
    expect(settingsDbErrorMessage({ code: "XX000", message: "internal error" }, "save")).toBe(SETTINGS_SAVE_FAILED);
    expect(settingsDbErrorMessage({ message: "fetch failed" }, "load")).toBe(SETTINGS_LOAD_FAILED);
  });

  it("logs the raw error on the server", () => {
    settingsDbErrorMessage({ code: "XX000", message: "internal error" }, "load");
    expect(console.error).toHaveBeenCalledWith("[settings] load failed", "XX000", "internal error");
  });
});
