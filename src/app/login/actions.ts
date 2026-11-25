"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { authErrorMessage } from "@/lib/auth/errors";
import { parseSignIn, parseSignUp, type CredentialField } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

// Auth Server Actions for the login page. Use them with useActionState;
// form fields: email, password.
//   success of signIn → redirect to "/"
//   success of signUp → redirect to "/", or a message to confirm the e-mail
//   signOut           → redirect to "/login"

export async function signIn(_prev: ActionState<CredentialField>, formData: FormData): Promise<ActionState<CredentialField>> {
  const parsed = parseSignIn({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.errors };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.value);
  if (error) return { ok: false, message: authErrorMessage(error, "sign in") };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(_prev: ActionState<CredentialField>, formData: FormData): Promise<ActionState<CredentialField>> {
  const parsed = parseSignUp({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.errors };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(parsed.value);
  if (error) return { ok: false, message: authErrorMessage(error, "sign up") };

  // With e-mail confirmation on, Supabase returns no session until the
  // link in the e-mail is opened.
  if (!data.session) {
    return { ok: true, message: "Konto on loodud. Ava e-postile saadetud link ja logi siis sisse." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  // Even if Supabase fails, the local cookies are cleared, so the user
  // ends up signed out on this device.
  if (error) authErrorMessage(error, "sign out");

  revalidatePath("/", "layout");
  redirect("/login");
}
