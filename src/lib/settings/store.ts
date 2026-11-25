import { useEffect, useSyncExternalStore } from "react";
import { getSettings, saveSettings as saveSettingsAction } from "@/app/settings/actions";
import { NO_LIMITS, type SaveSettingsResult, type Settings } from "@/lib/settings/types";

// The signed-in user's daily limits, shared by the settings page and the
// Today page. Read and written through the backend's Server Actions.

export type SettingsState = {
  status: "idle" | "loading" | "ready" | "error";
  settings: Settings;
  error: string | null;
};

const INITIAL: SettingsState = { status: "idle", settings: NO_LIMITS, error: null };
export const SETTINGS_OFFLINE = "Ühendus serveriga katkes. Kontrolli internetiühendust ja proovi uuesti.";

let state: SettingsState = INITIAL;
const listeners = new Set<() => void>();

function setState(patch: Partial<SettingsState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function getSettingsState(): SettingsState {
  return state;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function loadSettings(): Promise<void> {
  setState({ status: "loading" });
  try {
    const result = await getSettings();
    if (result.ok) setState({ status: "ready", settings: result.settings, error: null });
    else setState({ status: "error", settings: NO_LIMITS, error: result.message });
  } catch {
    setState({ status: "error", settings: NO_LIMITS, error: SETTINGS_OFFLINE });
  }
}

// Saves the limits and returns the server's answer for the form to show.
export async function saveSettings(settings: Settings): Promise<SaveSettingsResult> {
  let result: SaveSettingsResult;
  try {
    result = await saveSettingsAction(settings);
  } catch {
    result = { ok: false, message: SETTINGS_OFFLINE };
  }
  if (result.ok) setState({ status: "ready", settings: result.settings, error: null });
  return result;
}

// Forget the previous user's limits (called on the login page).
export function resetSettingsStore(): void {
  state = INITIAL;
  listeners.forEach((listener) => listener());
}

export function useSettings(): SettingsState {
  const current = useSyncExternalStore(subscribe, getSettingsState, () => INITIAL);
  useEffect(() => {
    if (getSettingsState().status === "idle") void loadSettings();
  }, []);
  return current;
}
