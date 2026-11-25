import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import AddIntakeView from "@/components/AddIntakeView";
import { getIntakes, resetIntakeStoreForTests } from "@/lib/intake/store";

beforeEach(() => {
  window.localStorage.clear();
  resetIntakeStoreForTests();
});
afterEach(cleanup);

describe("AddIntakeView", () => {
  it("adds a preset with one tap and confirms it", async () => {
    render(<AddIntakeView />);
    await userEvent.click(screen.getByRole("button", { name: "Lisa Snus, 3 mg" }));

    expect(getIntakes()).toMatchObject([{ substance: "nicotine", amountMg: 3, label: "Snus" }]);
    expect(screen.getByRole("status").textContent).toContain("Lisatud: Snus, 3 mg");
  });

  it("undoes the last added intake", async () => {
    render(<AddIntakeView />);
    await userEvent.click(screen.getByRole("button", { name: "Lisa Kohv, 95 mg" }));
    await userEvent.click(screen.getByRole("button", { name: "Võta tagasi" }));

    expect(getIntakes()).toEqual([]);
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("adds an intake from the manual form", async () => {
    render(<AddIntakeView />);
    await userEvent.type(screen.getByLabelText("Kogus (mg)"), "200");
    await userEvent.click(screen.getByRole("button", { name: "Lisa" }));

    expect(getIntakes()).toMatchObject([{ substance: "caffeine", amountMg: 200, label: "Kofeiin" }]);
  });
});
