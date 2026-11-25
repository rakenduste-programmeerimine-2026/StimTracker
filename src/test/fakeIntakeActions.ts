import { NOT_FOUND } from "@/lib/intake/results";
import type { Intake, NewIntake } from "@/lib/intake/types";

// In-memory stand-in for the intake Server Actions (src/app/intake/actions.ts).
// Only for tests: vi.mock("@/app/intake/actions", () => fake.actions).

type Failure = { ok: false; message: string; fieldErrors?: Record<string, string> };

export type FakeIntakeActions = ReturnType<typeof createFakeIntakeActions>;

export function createFakeIntakeActions(initial: Intake[] = []) {
  const rows: Intake[] = initial.map((r) => ({ ...r }));
  let nextFailure: Failure | "throw" | null = null;
  let counter = 0;

  function take() {
    const failure = nextFailure;
    nextFailure = null;
    if (failure === "throw") throw new TypeError("Failed to fetch");
    return failure;
  }

  const actions = {
    async listIntakes(from: string, to: string) {
      const failure = take();
      if (failure) return failure;
      const intakes = rows
        .filter((r) => r.takenAt >= new Date(from).toISOString() && r.takenAt <= new Date(to).toISOString())
        .sort((a, b) => b.takenAt.localeCompare(a.takenAt))
        .map((r) => ({ ...r }));
      return { ok: true as const, intakes };
    },
    async addIntake(input: NewIntake) {
      const failure = take();
      if (failure) return failure;
      const intake = { ...input, id: `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}` };
      rows.push(intake);
      return { ok: true as const, intake: { ...intake } };
    },
    async deleteIntake(id: string) {
      const failure = take();
      if (failure) return failure;
      const index = rows.findIndex((r) => r.id === id);
      if (index < 0) return { ok: false as const, message: NOT_FOUND };
      rows.splice(index, 1);
      return { ok: true as const };
    },
  };

  return {
    actions,
    rows,
    // The next action returns this failure, or throws like a lost connection.
    failNext(failure: Failure | "throw") {
      nextFailure = failure;
    },
  };
}
