"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { signIn, signUp } from "@/app/login/actions";
import { initialActionState, type ActionState } from "@/lib/action-state";
import { resetIntakeStore } from "@/lib/intake/store";
import type { CredentialField } from "@/lib/auth/validation";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/validation";
import styles from "./LoginForm.module.css";

type Mode = "signIn" | "signUp";

const ACTIONS = { signIn, signUp };
const SUBMIT_LABEL: Record<Mode, string> = { signIn: "Logi sisse", signUp: "Loo konto" };

// Login page form: one tab for logging in, one for creating an account.
// Checking the input and talking to Supabase happens in the Server Actions
// (src/app/login/actions.ts); this shows their messages next to the fields.
export default function LoginForm() {
  const [mode, setMode] = useState<Mode>("signIn");

  // Everyone passes this page between users (after logging out, before
  // logging in), so the previous user's intakes are forgotten here.
  useEffect(() => resetIntakeStore(), []);

  return (
    <>
      <div className={styles.modes}>
        {(Object.keys(SUBMIT_LABEL) as Mode[]).map((m) => (
          <button key={m} type="button" className={styles.mode} aria-pressed={mode === m} onClick={() => setMode(m)}>
            {SUBMIT_LABEL[m]}
          </button>
        ))}
      </div>
      {/* A new form per mode, so messages from the other tab do not linger. */}
      <CredentialsForm key={mode} mode={mode} />
    </>
  );
}

function CredentialsForm({ mode }: { mode: Mode }) {
  const id = useId();
  const [state, formAction, pending] = useActionState<ActionState<CredentialField>, FormData>(
    ACTIONS[mode],
    initialActionState,
  );
  const errors = state.fieldErrors ?? {};
  // Controlled, because React clears uncontrolled fields after every submit
  // and the user should not retype the email after a wrong password.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const field = (name: CredentialField) => ({
    id: `${id}-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${id}-${name}-error` : undefined,
  });
  const fieldError = (name: CredentialField) =>
    errors[name] ? (
      <p id={`${id}-${name}-error`} className={styles.error}>
        {errors[name]}
      </p>
    ) : null;

  return (
    <form className={styles.form} action={formAction} noValidate aria-label={SUBMIT_LABEL[mode]}>
      <div>
        <label className={styles.label} htmlFor={`${id}-email`}>
          E-post
        </label>
        <input
          {...field("email")}
          className={styles.input}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="mari@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {fieldError("email")}
      </div>

      <div>
        <label className={styles.label} htmlFor={`${id}-password`}>
          Parool
        </label>
        <input
          {...field("password")}
          className={styles.input}
          type="password"
          autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {fieldError("password")}
        {mode === "signUp" && !errors.password && (
          <p className={styles.hint}>Vähemalt {MIN_PASSWORD_LENGTH} märki.</p>
        )}
      </div>

      {state.message && (
        <p className={state.ok ? styles.notice : styles.alert} role={state.ok ? "status" : "alert"}>
          {state.message}
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "Oota…" : SUBMIT_LABEL[mode]}
      </button>
    </form>
  );
}
