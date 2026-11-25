import { useEffect, useSyncExternalStore } from "react";
import { addIntake as saveIntake, deleteIntake, listIntakes } from "@/app/intake/actions";
import { NOT_FOUND, type Failure } from "@/lib/intake/results";
import { startOfLocalDay } from "@/lib/intake/today";
import type { Intake, NewIntake } from "@/lib/intake/types";

// The signed-in user's intakes for today, kept in memory for the pages.
// Reading and writing goes through the backend's Server Actions
// (src/app/intake/actions.ts); they talk to Supabase and return Estonian
// messages, which are shown as they are.
//
// Adding and removing are optimistic: the screen changes at once and the
// change is taken back with a message if the server refuses it.

export type IntakeState = {
  status: "idle" | "loading" | "ready" | "error";
  intakes: readonly Intake[];
  error: string | null;
};

const INITIAL: IntakeState = { status: "idle", intakes: [], error: null };
// Shown when the request does not reach the server at all.
export const OFFLINE_MESSAGE = "Ühendus serveriga katkes. Kontrolli internetiühendust ja proovi uuesti.";
// The server allows a dose up to a minute in the future (phone clocks).
const CLOCK_SLACK_MS = 60 * 1000;

let state: IntakeState = INITIAL;
let loadRequest = 0;
const listeners = new Set<() => void>();

function setState(patch: Partial<IntakeState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function byNewest(a: Intake, b: Intake) {
  return b.takenAt.localeCompare(a.takenAt);
}

// The most specific message from a failed action: a field error if there
// is one (e.g. "Kogus peab olema suurem kui 0."), otherwise the general one.
function failureMessage(result: Failure): string {
  const fieldMessage = result.fieldErrors && Object.values(result.fieldErrors).find(Boolean);
  return fieldMessage ?? result.message;
}

export function getIntakeState(): IntakeState {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isPending(id: string): boolean {
  return id.startsWith("pending-");
}

// Loads today's intakes. "Today" starts at the user's own midnight, so the
// browser sends the range (the server runs in UTC).
export async function loadIntakes(now: Date = new Date()): Promise<void> {
  const request = ++loadRequest;
  setState({ status: state.status === "ready" ? "ready" : "loading" });

  let result;
  try {
    result = await listIntakes(
      startOfLocalDay(now).toISOString(),
      new Date(now.getTime() + CLOCK_SLACK_MS).toISOString(),
    );
  } catch {
    result = { ok: false as const, message: OFFLINE_MESSAGE };
  }

  // A newer load started meanwhile (e.g. after switching tabs): keep that one.
  if (request !== loadRequest) return;

  if (!result.ok) {
    setState({ status: "error", error: failureMessage(result) });
    return;
  }
  // Keep intakes that are still being saved; the list does not have them yet.
  const pending = state.intakes.filter((i) => isPending(i.id));
  setState({ status: "ready", intakes: [...result.intakes, ...pending].sort(byNewest), error: null });
}

// Saves a new intake. Returns the saved intake (with its id, for undo), or
// null if saving failed; the error banner then says why.
export async function addIntake(input: NewIntake): Promise<Intake | null> {
  const tempId = `pending-${crypto.randomUUID()}`;
  setState({ intakes: [...state.intakes, { ...input, id: tempId }].sort(byNewest), error: null });

  let result;
  try {
    result = await saveIntake(input);
  } catch {
    result = { ok: false as const, message: OFFLINE_MESSAGE };
  }

  if (!result.ok) {
    setState({ intakes: state.intakes.filter((i) => i.id !== tempId), error: failureMessage(result) });
    return null;
  }
  const saved = result.intake;
  setState({ intakes: state.intakes.map((i) => (i.id === tempId ? saved : i)) });
  return saved;
}

// Deletes an intake. Returns false if the server refused.
export async function removeIntake(id: string): Promise<boolean> {
  // Still being saved: it has no database id yet.
  if (isPending(id)) return false;
  const removed = state.intakes.find((i) => i.id === id);
  if (!removed) return true;
  setState({ intakes: state.intakes.filter((i) => i.id !== id), error: null });

  let result;
  try {
    result = await deleteIntake(id);
  } catch {
    result = { ok: false as const, message: OFFLINE_MESSAGE };
  }

  // Already gone (e.g. deleted on another device): that is what the user wanted.
  if (result.ok || result.message === NOT_FOUND) return true;

  setState({ intakes: [...state.intakes, removed].sort(byNewest), error: failureMessage(result) });
  return false;
}

export function dismissIntakeError(): void {
  setState({ error: null });
}

// Forget everything, so the next user who logs in on this device starts clean.
export function resetIntakeStore(): void {
  state = INITIAL;
  loadRequest++;
  listeners.forEach((listener) => listener());
}

// Today's intakes. Loads them on first use and again when the user comes
// back to the tab, so changes from another device show up.
export function useIntakes(): IntakeState {
  const current = useSyncExternalStore(subscribe, getIntakeState, () => INITIAL);

  useEffect(() => {
    if (getIntakeState().status === "idle") void loadIntakes();
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadIntakes();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return current;
}
