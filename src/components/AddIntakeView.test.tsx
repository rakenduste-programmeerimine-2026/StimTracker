import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FakeIntakeActions } from "@/test/fakeIntakeActions";
import { resetFakeIntakeActions } from "@/test/mockIntakeActions";

vi.mock("@/app/intake/actions", async () => (await import("@/test/mockIntakeActions")).mockedActions);

import AddIntakeView from "@/components/AddIntakeView";
import { resetIntakeStore } from "@/lib/intake/store";

let db: FakeIntakeActions;

beforeEach(() => {
  db = resetFakeIntakeActions();
  resetIntakeStore();
});
afterEach(cleanup);

describe("AddIntakeView", () => {
  it("saves a preset with one tap and confirms it", async () => {
    render(<AddIntakeView />);
    await userEvent.click(screen.getByRole("button", { name: "Lisa Snus, 3 mg" }));

    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Lisatud: Snus, 3 mg"));
    expect(db.rows).toMatchObject([{ substance: "nicotine", amountMg: 3, label: "Snus" }]);
  });

  it("undoes the last added intake on the server", async () => {
    render(<AddIntakeView />);
    await userEvent.click(screen.getByRole("button", { name: "Lisa Kohv, 95 mg" }));
    await userEvent.click(await screen.findByRole("button", { name: "Võta tagasi" }));

    await waitFor(() => expect(db.rows).toEqual([]));
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("saves an intake from the manual form", async () => {
    render(<AddIntakeView />);
    await userEvent.click(screen.getByRole("button", { name: "Muu kogus või aeg" }));
    await userEvent.type(screen.getByLabelText("Kogus (mg)"), "200");
    await userEvent.click(screen.getByRole("button", { name: "Lisa" }));

    await waitFor(() => expect(db.rows).toMatchObject([{ substance: "caffeine", amountMg: 200, label: "Kofeiin" }]));
  });

  it("shows no confirmation when saving fails", async () => {
    db.failNext("throw");
    render(<AddIntakeView />);
    await userEvent.click(screen.getByRole("button", { name: "Lisa Snus, 3 mg" }));

    await waitFor(() => expect(db.rows).toEqual([]));
    expect(screen.getByRole("status").textContent).toBe("");
  });
});
