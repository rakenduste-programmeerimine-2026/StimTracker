import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import TodayView from "@/components/TodayView";
import type { Intake } from "@/lib/intake/types";

afterEach(cleanup);

const now = new Date(2026, 10, 25, 15, 0);
const intake = (substance: Intake["substance"], amountMg: number, hour: number): Intake => ({
  id: `${substance}-${hour}`,
  substance,
  amountMg,
  takenAt: new Date(2026, 10, 25, hour).toISOString(),
  label: substance,
});

describe("TodayView", () => {
  it("shows an empty state with a link to add", () => {
    render(<TodayView intakes={[]} now={now} />);
    expect(screen.getByText("Täna pole veel midagi lisatud.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Lisa esimene" }).getAttribute("href")).toBe("/add");
  });

  it("shows taken and remaining amounts per substance", () => {
    render(<TodayView intakes={[intake("caffeine", 160, 10), intake("caffeine", 80, 15)]} now={now} />);

    const caffeine = screen.getByRole("article", { name: "Kofeiin" });
    // 160 mg 5 h ago -> 80 mg, plus 80 mg just now = 160 of 240 mg
    expect(within(caffeine).getByText("240 mg")).toBeTruthy(); // taken today
    expect(within(caffeine).getByRole("meter").textContent).toContain("160mg"); // in body now
    expect(within(caffeine).getByRole("meter").getAttribute("aria-valuenow")).toBe("67");
    expect(within(caffeine).getByText("2 korda")).toBeTruthy();

    const nicotine = screen.getByRole("article", { name: "Nikotiin" });
    expect(within(nicotine).getByText("Täna pole veel lisatud.")).toBeTruthy();
    expect(screen.queryByText("Täna pole veel midagi lisatud.")).toBeNull();
  });

  it("explains that the numbers are an estimate", () => {
    render(<TodayView intakes={[]} now={now} />);
    expect(screen.getByText(/ei ole meditsiiniline nõuanne/)).toBeTruthy();
  });
});
