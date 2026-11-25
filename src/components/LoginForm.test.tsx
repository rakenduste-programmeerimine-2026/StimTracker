import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionState } from "@/lib/action-state";

type Action = (prev: ActionState, data: FormData) => Promise<ActionState>;
const actions = vi.hoisted(() => ({
  signIn: vi.fn<Action>(),
  signUp: vi.fn<Action>(),
}));
vi.mock("@/app/login/actions", () => actions);

import LoginForm from "@/components/LoginForm";

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

// The tab button and the submit button share a label; the submit one is in the form.
function submitButton(name: string) {
  return screen.getAllByRole("button", { name }).find((b) => b.getAttribute("type") === "submit")!;
}

async function fillAndSubmit(email: string, password: string, submit: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("E-post"), email);
  await user.type(screen.getByLabelText("Parool"), password);
  await user.click(submitButton(submit));
}

describe("LoginForm", () => {
  it("sends the email and password to the sign-in action", async () => {
    actions.signIn.mockResolvedValue({ ok: true });
    render(<LoginForm />);
    await fillAndSubmit("mari@example.com", "secret12", "Logi sisse");

    expect(actions.signIn).toHaveBeenCalledTimes(1);
    const data = actions.signIn.mock.calls[0][1];
    expect(data.get("email")).toBe("mari@example.com");
    expect(data.get("password")).toBe("secret12");
  });

  it("shows field errors from the action and keeps the typed email", async () => {
    actions.signIn.mockResolvedValue({ ok: false, fieldErrors: { password: "Sisesta parool." } });
    render(<LoginForm />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("E-post"), "mari@example.com");
    await user.click(submitButton("Logi sisse"));

    expect(await screen.findByText("Sisesta parool.")).toBeTruthy();
    expect(screen.getByLabelText("Parool").getAttribute("aria-invalid")).toBe("true");
    expect((screen.getByLabelText("E-post") as HTMLInputElement).value).toBe("mari@example.com");
  });

  it("shows a form-level error as an alert", async () => {
    actions.signIn.mockResolvedValue({ ok: false, message: "Vale e-post või parool." });
    render(<LoginForm />);
    await fillAndSubmit("mari@example.com", "wrong", "Logi sisse");

    expect((await screen.findByRole("alert")).textContent).toBe("Vale e-post või parool.");
  });

  it("uses the sign-up action on the create-account tab", async () => {
    actions.signUp.mockResolvedValue({ ok: true, message: "Konto on loodud." });
    render(<LoginForm />);
    await userEvent.click(screen.getByRole("button", { name: "Loo konto", pressed: false }));
    expect(screen.getByText("Vähemalt 8 märki.")).toBeTruthy();

    await fillAndSubmit("mari@example.com", "secret12", "Loo konto");
    expect(actions.signUp).toHaveBeenCalledTimes(1);
    expect(actions.signIn).not.toHaveBeenCalled();
    expect((await screen.findByRole("status")).textContent).toBe("Konto on loodud.");
  });

  it("clears messages when switching tabs", async () => {
    actions.signIn.mockResolvedValue({ ok: false, message: "Vale e-post või parool." });
    render(<LoginForm />);
    await fillAndSubmit("mari@example.com", "wrong", "Logi sisse");
    await screen.findByRole("alert");

    await userEvent.click(screen.getByRole("button", { name: "Loo konto", pressed: false }));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
