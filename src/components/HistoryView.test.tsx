import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import HistoryView from "@/components/HistoryView";
import { addIntake, getIntakes, resetIntakeStoreForTests } from "@/lib/intake/store";

const now = new Date(2026, 10, 25, 15, 0);

beforeEach(() => {
  window.localStorage.clear();
  resetIntakeStoreForTests();
});
afterEach(cleanup);

function addAt(label: string, hour: number, day = 25) {
  return addIntake({
    substance: "caffeine",
    amountMg: 95,
    label,
    takenAt: new Date(2026, 10, day, hour).toISOString(),
  });
}

describe("HistoryView", () => {
  it("shows an empty message when nothing was added today", () => {
    addAt("Eilne kohv", 20, 24);
    render(<HistoryView now={now} />);
    expect(screen.getByText(/Täna pole veel midagi lisatud/)).toBeTruthy();
  });

  it("lists today's intakes newest first", () => {
    addAt("Hommikukohv", 8);
    addAt("Lõunakohv", 13);
    render(<HistoryView now={now} />);

    const items = within(screen.getByRole("list", { name: "Tänased kirjed" })).getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual([
      expect.stringContaining("Lõunakohv"),
      expect.stringContaining("Hommikukohv"),
    ]);
  });

  it("deletes only after confirmation", async () => {
    const user = userEvent.setup();
    const keep = addAt("Hommikukohv", 8);
    addAt("Lõunakohv", 13);
    render(<HistoryView now={now} />);

    await user.click(screen.getByRole("button", { name: /^Kustuta Lõunakohv/ }));
    expect(getIntakes()).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /^Kinnita: kustuta Lõunakohv/ }));
    expect(getIntakes()).toEqual([keep]);
    expect(screen.queryByText("Lõunakohv")).toBeNull();
  });

  it("cancels a delete", async () => {
    const user = userEvent.setup();
    addAt("Hommikukohv", 8);
    render(<HistoryView now={now} />);

    await user.click(screen.getByRole("button", { name: /^Kustuta Hommikukohv/ }));
    await user.click(screen.getByRole("button", { name: "Loobu" }));
    expect(getIntakes()).toHaveLength(1);
    expect(screen.getByRole("button", { name: /^Kustuta Hommikukohv/ })).toBeTruthy();
  });
});
