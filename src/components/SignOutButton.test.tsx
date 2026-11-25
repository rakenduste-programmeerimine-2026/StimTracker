import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const signOut = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@/app/login/actions", () => ({ signOut }));

import SignOutButton from "@/components/SignOutButton";

afterEach(cleanup);

describe("SignOutButton", () => {
  it("calls the sign-out action", async () => {
    render(<SignOutButton />);
    await userEvent.click(screen.getByRole("button", { name: "Logi välja" }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
