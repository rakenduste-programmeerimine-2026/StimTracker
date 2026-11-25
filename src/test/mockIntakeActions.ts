import { createFakeIntakeActions, type FakeIntakeActions } from "@/test/fakeIntakeActions";

// Shared holder for vi.mock("@/app/intake/actions", ...) in tests:
//   vi.mock("@/app/intake/actions", async () => (await import("@/test/mockIntakeActions")).mockedActions);
//   beforeEach(() => resetFakeIntakeActions([...rows]));

let current: FakeIntakeActions = createFakeIntakeActions();

export function resetFakeIntakeActions(...args: Parameters<typeof createFakeIntakeActions>): FakeIntakeActions {
  current = createFakeIntakeActions(...args);
  return current;
}

export const mockedActions = {
  listIntakes: (from: string, to: string) => current.actions.listIntakes(from, to),
  addIntake: (...args: Parameters<FakeIntakeActions["actions"]["addIntake"]>) => current.actions.addIntake(...args),
  deleteIntake: (id: string) => current.actions.deleteIntake(id),
};
