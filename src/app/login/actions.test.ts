import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialActionState } from "@/lib/action-state";

// --- Mocks: Supabase Auth and Next.js ---------------------------------------

type AuthResult = { data?: unknown; error: { code?: string; status?: number; message: string } | null };

const auth = {
  signInWithPassword: vi.fn<(credentials: unknown) => Promise<AuthResult>>(async () => ({ data: {}, error: null })),
  signUp: vi.fn<(credentials: unknown) => Promise<AuthResult>>(async () => ({ data: { session: {} }, error: null })),
  signOut: vi.fn(async (): Promise<AuthResult> => ({ error: null })),
};
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth }) }));

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }));

// Like Next.js, redirect() stops the action by throwing.
class Redirect extends Error {
  constructor(readonly to: string) {
    super(`redirect to ${to}`);
  }
}
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Redirect(to);
  },
}));

const { signIn, signOut, signUp } = await import("@/app/login/actions");

// --- Helpers -----------------------------------------------------------------

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

async function redirectOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof Redirect) return error.to;
    throw error;
  }
  throw new Error("expected a redirect");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// --- Tests -------------------------------------------------------------------

describe("signIn", () => {
  it("signs in with the cleaned-up e-mail and goes to the home page", async () => {
    const to = await redirectOf(signIn(initialActionState, form({ email: " Mari@Example.com", password: "secret" })));

    expect(to).toBe("/");
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "mari@example.com", password: "secret" });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("returns field errors without calling Supabase", async () => {
    const state = await signIn(initialActionState, form({ email: "", password: "" }));

    expect(state.ok).toBe(false);
    expect(state.fieldErrors).toEqual({ email: "Sisesta e-posti aadress.", password: "Sisesta parool." });
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("shows an Estonian message for wrong credentials", async () => {
    auth.signInWithPassword.mockResolvedValueOnce({
      error: { code: "invalid_credentials", status: 400, message: "Invalid login credentials" },
    });

    const state = await signIn(initialActionState, form({ email: "mari@example.com", password: "wrong" }));

    expect(state).toEqual({ ok: false, message: "Vale e-post või parool." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("signUp", () => {
  it("goes to the home page when Supabase signs the user in right away", async () => {
    const to = await redirectOf(signUp(initialActionState, form({ email: "mari@example.com", password: "long enough" })));

    expect(to).toBe("/");
    expect(auth.signUp).toHaveBeenCalledWith({ email: "mari@example.com", password: "long enough" });
  });

  it("asks to confirm the e-mail when there is no session yet", async () => {
    auth.signUp.mockResolvedValueOnce({ data: { session: null, user: {} }, error: null });

    const state = await signUp(initialActionState, form({ email: "mari@example.com", password: "long enough" }));

    expect(state.ok).toBe(true);
    expect(state.message).toMatch(/e-postile saadetud link/);
  });

  it("checks the password length before calling Supabase", async () => {
    const state = await signUp(initialActionState, form({ email: "mari@example.com", password: "short" }));

    expect(state.fieldErrors?.password).toMatch(/vähemalt 8 märki/);
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("explains when the account already exists", async () => {
    auth.signUp.mockResolvedValueOnce({
      error: { code: "user_already_exists", status: 422, message: "User already registered" },
    });

    const state = await signUp(initialActionState, form({ email: "mari@example.com", password: "long enough" }));

    expect(state.ok).toBe(false);
    expect(state.message).toMatch(/juba olemas/);
  });
});

describe("signOut", () => {
  it("signs out and goes to the login page", async () => {
    expect(await redirectOf(signOut())).toBe("/login");
    expect(auth.signOut).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("still goes to the login page when Supabase fails", async () => {
    auth.signOut.mockResolvedValueOnce({ error: { status: 500, message: "network error" } });

    expect(await redirectOf(signOut())).toBe("/login");
  });
});
