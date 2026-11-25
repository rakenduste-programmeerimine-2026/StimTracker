import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import PresetButtons from "@/components/PresetButtons";
import { PRESETS } from "@/lib/intake/presets";

afterEach(cleanup);

describe("PresetButtons", () => {
  it("shows every preset grouped by substance", () => {
    render(<PresetButtons onPick={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(PRESETS.length);
    expect(screen.getByRole("heading", { name: "Kofeiin" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Nikotiin" })).toBeTruthy();
  });

  it("passes the picked preset to onPick", async () => {
    const onPick = vi.fn();
    render(<PresetButtons onPick={onPick} />);
    await userEvent.click(screen.getByRole("button", { name: "Lisa Espresso, 63 mg" }));
    expect(onPick).toHaveBeenCalledWith(PRESETS.find((p) => p.id === "espresso"));
  });
});

describe("PRESETS", () => {
  it("has unique ids and positive amounts", () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
    for (const preset of PRESETS) expect(preset.amountMg).toBeGreaterThan(0);
  });
});
