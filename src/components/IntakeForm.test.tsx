import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import IntakeForm from "@/components/IntakeForm";

afterEach(cleanup);

const now = () => new Date(2026, 10, 25, 15, 0);

function setup() {
  const onSubmit = vi.fn();
  render(<IntakeForm onSubmit={onSubmit} now={now} />);
  return { onSubmit, user: userEvent.setup() };
}

describe("IntakeForm", () => {
  it("defaults to caffeine and the current time", () => {
    setup();
    expect((screen.getByRole("radio", { name: "Kofeiin" }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText("Aeg") as HTMLInputElement).value).toBe("2026-11-25T15:00");
  });

  it("submits a valid intake and clears the amount", async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole("radio", { name: "Nikotiin" }));
    await user.type(screen.getByLabelText("Kogus (mg)"), "1,5");
    await user.type(screen.getByLabelText("Nimetus (valikuline)"), "Velo");
    await user.click(screen.getByRole("button", { name: "Lisa" }));

    expect(onSubmit).toHaveBeenCalledWith({
      substance: "nicotine",
      amountMg: 1.5,
      takenAt: new Date(2026, 10, 25, 15, 0),
      label: "Velo",
    });
    expect((screen.getByLabelText("Kogus (mg)") as HTMLInputElement).value).toBe("");
    expect((screen.getByRole("radio", { name: "Nikotiin" }) as HTMLInputElement).checked).toBe(true);
  });

  it("shows Estonian errors and does not submit invalid input", async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole("button", { name: "Lisa" }));

    expect(onSubmit).not.toHaveBeenCalled();
    const amount = screen.getByLabelText("Kogus (mg)");
    expect(amount.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Sisesta kogus milligrammides.")).toBeTruthy();
  });

  it("clears a field's error when the user edits it", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Lisa" }));
    await user.type(screen.getByLabelText("Kogus (mg)"), "9");
    expect(screen.queryByText("Sisesta kogus milligrammides.")).toBeNull();
  });
});
