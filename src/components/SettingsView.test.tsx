import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GetSettingsResult, SaveSettingsResult, Settings } from "@/lib/settings/types";

const actions = vi.hoisted(() => ({
  getSettings: vi.fn<() => Promise<GetSettingsResult>>(),
  saveSettings: vi.fn<(input: Settings) => Promise<SaveSettingsResult>>(),
}));
vi.mock("@/app/settings/actions", () => actions);

import SettingsView from "@/components/SettingsView";
import { resetSettingsStore } from "@/lib/settings/store";

beforeEach(() => {
  vi.clearAllMocks();
  resetSettingsStore();
  actions.getSettings.mockResolvedValue({ ok: true, settings: { caffeineLimitMg: 400, nicotineLimitMg: null } });
  actions.saveSettings.mockImplementation(async (settings) => ({ ok: true, settings }));
});
afterEach(cleanup);

const caffeineInput = () => screen.getByLabelText("Kofeiin päevas") as HTMLInputElement;
const nicotineInput = () => screen.getByLabelText("Nikotiin päevas") as HTMLInputElement;

describe("SettingsView", () => {
  it("fills the form with the saved limits", async () => {
    render(<SettingsView />);
    await waitFor(() => expect(caffeineInput().value).toBe("400"));
    expect(nicotineInput().value).toBe("");
  });

  it("saves new limits and confirms", async () => {
    render(<SettingsView />);
    await waitFor(() => expect(caffeineInput().value).toBe("400"));
    const user = userEvent.setup();
    await user.clear(caffeineInput());
    await user.type(caffeineInput(), "300");
    await user.type(nicotineInput(), "20");
    await user.click(screen.getByRole("button", { name: "Salvesta" }));

    expect(actions.saveSettings).toHaveBeenCalledWith({ caffeineLimitMg: 300, nicotineLimitMg: 20 });
    expect((await screen.findByRole("status")).textContent).toBe("Salvestatud.");
  });

  it("clearing a field removes the limit", async () => {
    render(<SettingsView />);
    await waitFor(() => expect(caffeineInput().value).toBe("400"));
    await userEvent.clear(caffeineInput());
    await userEvent.click(screen.getByRole("button", { name: "Salvesta" }));
    expect(actions.saveSettings).toHaveBeenCalledWith({ caffeineLimitMg: null, nicotineLimitMg: null });
  });

  it("checks the range before calling the server", async () => {
    render(<SettingsView />);
    await waitFor(() => expect(caffeineInput().value).toBe("400"));
    await userEvent.type(nicotineInput(), "500");
    await userEvent.click(screen.getByRole("button", { name: "Salvesta" }));

    expect(screen.getByText("Limiit peab olema 1–200 mg.")).toBeTruthy();
    expect(nicotineInput().getAttribute("aria-invalid")).toBe("true");
    expect(actions.saveSettings).not.toHaveBeenCalled();
  });

  it("shows the server's message while the backend is missing", async () => {
    actions.getSettings.mockResolvedValue({ ok: false, message: "Päevalimiidi salvestamine pole veel valmis." });
    actions.saveSettings.mockResolvedValue({ ok: false, message: "Päevalimiidi salvestamine pole veel valmis." });
    render(<SettingsView />);

    expect((await screen.findByRole("alert")).textContent).toBe("Päevalimiidi salvestamine pole veel valmis.");
    await userEvent.type(caffeineInput(), "400");
    await userEvent.click(screen.getByRole("button", { name: "Salvesta" }));
    await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(2));
  });
});
