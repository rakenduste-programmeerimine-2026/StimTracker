import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Intake } from "@/lib/intake/types";
import type { FakeIntakeActions } from "@/test/fakeIntakeActions";
import { resetFakeIntakeActions } from "@/test/mockIntakeActions";

vi.mock("@/app/intake/actions", async () => (await import("@/test/mockIntakeActions")).mockedActions);

import HistoryView from "@/components/HistoryView";
import { loadIntakes, resetIntakeStore } from "@/lib/intake/store";

const now = new Date(2026, 10, 25, 15, 0);
const at = (h: number, day = 25) => new Date(2026, 10, day, h).toISOString();
let db: FakeIntakeActions;

const morning: Intake = { id: "00000000-0000-4000-8000-00000000000a", substance: "caffeine", amountMg: 95, takenAt: at(8), label: "Hommikukohv" };
const noon: Intake = { id: "00000000-0000-4000-8000-00000000000b", substance: "caffeine", amountMg: 95, takenAt: at(13), label: "Lõunakohv" };

async function setup(rows: Intake[]) {
  db = resetFakeIntakeActions(rows);
  resetIntakeStore();
  await loadIntakes(now);
  render(<HistoryView now={now} />);
}

beforeEach(() => resetIntakeStore());
afterEach(cleanup);

describe("HistoryView", () => {
  it("shows an empty message when nothing was added today", async () => {
    await setup([{ ...morning, takenAt: at(20, 24) }]);
    expect(screen.getByText(/Täna pole veel midagi lisatud/)).toBeTruthy();
  });

  it("lists today's intakes newest first", async () => {
    await setup([morning, noon]);
    const items = within(screen.getByRole("list", { name: "Tänased kirjed" })).getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual([
      expect.stringContaining("Lõunakohv"),
      expect.stringContaining("Hommikukohv"),
    ]);
  });

  it("deletes on the server only after confirmation", async () => {
    await setup([morning, noon]);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /^Kustuta Lõunakohv/ }));
    expect(db.rows).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /^Kinnita: kustuta Lõunakohv/ }));
    await waitFor(() => expect(db.rows.map((r) => r.label)).toEqual(["Hommikukohv"]));
    expect(screen.queryByText("Lõunakohv")).toBeNull();
  });

  it("cancels a delete", async () => {
    await setup([morning]);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^Kustuta Hommikukohv/ }));
    await user.click(screen.getByRole("button", { name: "Loobu" }));
    expect(db.rows).toHaveLength(1);
  });

  it("offers a retry when loading fails", async () => {
    db = resetFakeIntakeActions([morning]);
    resetIntakeStore();
    db.failNext("throw");
    await loadIntakes(now);
    render(<HistoryView now={now} />);

    expect(screen.getByRole("alert").textContent).toContain("Ühendus serveriga katkes");
    await userEvent.click(screen.getByRole("button", { name: "Proovi uuesti" }));
    expect(await screen.findByText("Hommikukohv")).toBeTruthy();
  });
});
