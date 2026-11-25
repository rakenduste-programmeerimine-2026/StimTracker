import { useSyncExternalStore } from "react";
import { isSubstance } from "@/lib/intake/substances";
import type { Intake, NewIntake } from "@/lib/intake/types";

// Mock data source until the Supabase table is ready: intakes are kept in
// the browser's localStorage. The UI only uses useIntakes, addIntake and
// removeIntake, so switching to Supabase means changing this file only.

const STORAGE_KEY = "stimtracker.intakes.v1";
const EMPTY: Intake[] = [];

let cache: Intake[] | null = null;
const listeners = new Set<() => void>();

function isIntake(value: unknown): value is Intake {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    isSubstance(v.substance) &&
    typeof v.amountMg === "number" &&
    typeof v.takenAt === "string" &&
    typeof v.label === "string"
  );
}

function load(): Intake[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isIntake) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function save(next: Intake[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked (private mode): keep the in-memory copy.
  }
  listeners.forEach((listener) => listener());
}

export function getIntakes(): Intake[] {
  cache ??= load();
  return cache;
}

export function addIntake(input: NewIntake): Intake {
  const intake: Intake = { ...input, id: crypto.randomUUID() };
  save([...getIntakes(), intake]);
  return intake;
}

export function removeIntake(id: string): void {
  save(getIntakes().filter((intake) => intake.id !== id));
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  cache = null;
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

// All intakes, re-rendering when they change (also from another tab).
export function useIntakes(): Intake[] {
  return useSyncExternalStore(subscribe, getIntakes, () => EMPTY);
}

// Only for tests: forget the in-memory copy so each test starts clean.
export function resetIntakeStoreForTests(): void {
  cache = null;
}
