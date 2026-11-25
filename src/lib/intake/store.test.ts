import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FakeIntakeActions } from "@/test/fakeIntakeActions";
import { resetFakeIntakeActions } from "@/test/mockIntakeActions";

vi.mock("@/app/intake/actions", async () => (await import("@/test/mockIntakeActions")).mockedActions);

import { NOT_FOUND } from "@/lib/intake/results";
import {
  addIntake,
  dismissIntakeError,
  getIntakeState,
  loadIntakes,
  OFFLINE_MESSAGE,
  removeIntake,
  resetIntakeStore,
  subscribe,
} from "@/lib/intake/store";

const now = new Date(2026, 10, 25, 15, 0);
const at = (h: number, day = 25) => new Date(2026, 10, day, h).toISOString();
const id = (n: number) => `00000000-0000-4000-8000-a0000000000${n}`;
let db: FakeIntakeActions;

beforeEach(() => {
  db = resetFakeIntakeActions([
    { id: id(1), substance: "caffeine", amountMg: 95, takenAt: at(8), label: "Kohv" },
    { id: id(2), substance: "nicotine", amountMg: 3, takenAt: at(12), label: "Snus" },
    { id: id(3), substance: "caffeine", amountMg: 63, takenAt: at(20, 24), label: "Eilne" },
  ]);
  resetIntakeStore();
});

describe("intake store", () => {
  it("loads today's intakes from local midnight, newest first", async () => {
    expect(getIntakeState().status).toBe("idle");
    await loadIntakes(now);
    expect(getIntakeState().status).toBe("ready");
    expect(getIntakeState().intakes.map((i) => i.label)).toEqual(["Snus", "Kohv"]);
  });

  it("shows the server's message when loading fails", async () => {
    db.failNext({ ok: false, message: "Logi sisse, et tarbimisi salvestada ja näha." });
    await loadIntakes(now);
    expect(getIntakeState()).toMatchObject({ status: "error", error: "Logi sisse, et tarbimisi salvestada ja näha." });
  });

  it("explains a lost connection", async () => {
    db.failNext("throw");
    await loadIntakes(now);
    expect(getIntakeState().error).toBe(OFFLINE_MESSAGE);
  });

  it("shows a new intake at once and replaces it with the saved one", async () => {
    await loadIntakes(now);
    const pending = addIntake({ substance: "caffeine", amountMg: 80, takenAt: at(14), label: "Energiajook" });
    expect(getIntakeState().intakes[0].id).toMatch(/^pending-/);

    const saved = await pending;
    expect(saved).toMatchObject({ label: "Energiajook", amountMg: 80 });
    expect(getIntakeState().intakes[0].id).toBe(saved!.id);
    expect(db.rows).toHaveLength(4);
  });

  it("takes a refused intake back and shows the field message", async () => {
    await loadIntakes(now);
    db.failNext({ ok: false, message: "Andmed on vigased.", fieldErrors: { takenAt: "Aeg ei saa olla tulevikus." } });
    const saved = await addIntake({ substance: "caffeine", amountMg: 80, takenAt: at(14), label: "Energiajook" });

    expect(saved).toBeNull();
    expect(getIntakeState().intakes).toHaveLength(2);
    expect(getIntakeState().error).toBe("Aeg ei saa olla tulevikus.");
  });

  it("removes an intake and puts it back if the server refuses", async () => {
    await loadIntakes(now);
    expect(await removeIntake(id(1))).toBe(true);
    expect(db.rows.map((r) => r.id)).not.toContain(id(1));

    db.failNext({ ok: false, message: "Salvestamine ebaõnnestus. Proovi uuesti." });
    expect(await removeIntake(id(2))).toBe(false);
    expect(getIntakeState().intakes.map((i) => i.id)).toEqual([id(2)]);
    expect(getIntakeState().error).toBe("Salvestamine ebaõnnestus. Proovi uuesti.");

    dismissIntakeError();
    expect(getIntakeState().error).toBeNull();
  });

  it("treats an intake that is already gone as deleted", async () => {
    await loadIntakes(now);
    db.failNext({ ok: false, message: NOT_FOUND });
    expect(await removeIntake(id(1))).toBe(true);
    expect(getIntakeState().error).toBeNull();
  });

  it("does not delete an intake that is still being saved", async () => {
    expect(await removeIntake("pending-1")).toBe(false);
  });

  it("notifies subscribers and forgets everything on reset", async () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    await loadIntakes(now);
    expect(listener).toHaveBeenCalled();
    resetIntakeStore();
    expect(getIntakeState()).toEqual({ status: "idle", intakes: [], error: null });
    unsubscribe();
  });
});
