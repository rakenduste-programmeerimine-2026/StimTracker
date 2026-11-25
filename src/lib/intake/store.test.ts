import { beforeEach, describe, expect, it, vi } from "vitest";
import { addIntake, getIntakes, removeIntake, resetIntakeStoreForTests, subscribe } from "@/lib/intake/store";

const espresso = { substance: "caffeine", amountMg: 63, takenAt: "2026-11-25T08:00:00.000Z", label: "Espresso" } as const;

beforeEach(() => {
  window.localStorage.clear();
  resetIntakeStoreForTests();
});

describe("intake store", () => {
  it("starts empty", () => {
    expect(getIntakes()).toEqual([]);
  });

  it("adds an intake with a new id and keeps it after reload", () => {
    const added = addIntake(espresso);
    expect(added.id).toBeTruthy();
    resetIntakeStoreForTests();
    expect(getIntakes()).toEqual([added]);
  });

  it("removes an intake by id", () => {
    const a = addIntake(espresso);
    const b = addIntake({ ...espresso, label: "Kohv" });
    removeIntake(a.id);
    expect(getIntakes()).toEqual([b]);
  });

  it("notifies subscribers on change", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    addIntake(espresso);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    addIntake(espresso);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("ignores broken or foreign data in storage", () => {
    window.localStorage.setItem("stimtracker.intakes.v1", "not json");
    expect(getIntakes()).toEqual([]);
    resetIntakeStoreForTests();
    window.localStorage.setItem(
      "stimtracker.intakes.v1",
      JSON.stringify([{ ...espresso, id: "1" }, { id: "2", substance: "alcohol" }]),
    );
    expect(getIntakes()).toEqual([{ ...espresso, id: "1" }]);
  });
});
