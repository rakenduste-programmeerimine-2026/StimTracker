// Validation for the sign-in and sign-up forms. Messages are in Estonian.
// Supabase checks everything again; this only gives clear messages early.

export type CredentialField = "email" | "password";
export type Credentials = { email: string; password: string };
export type CredentialErrors = Partial<Record<CredentialField, string>>;
export type CredentialsResult = { ok: true; value: Credentials } | { ok: false; errors: CredentialErrors };

// Supabase itself accepts 6 characters; new accounts are asked for more.
export const MIN_PASSWORD_LENGTH = 8;
// Longer passwords are cut off by bcrypt, so Supabase rejects them.
export const MAX_PASSWORD_LENGTH = 72;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: FormDataEntryValue | null | undefined): string {
  return typeof value === "string" ? value : "";
}

function validateEmail(raw: string, errors: CredentialErrors): string {
  const email = raw.trim().toLowerCase();
  if (email === "") errors.email = "Sisesta e-posti aadress.";
  else if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    errors.email = "E-posti aadress ei ole õiges vormingus.";
  }
  return email;
}

// Sign-in only checks that something was typed: older accounts may have
// shorter passwords, and Supabase gives the real answer anyway.
export function parseSignIn(form: { email?: FormDataEntryValue | null; password?: FormDataEntryValue | null }): CredentialsResult {
  const errors: CredentialErrors = {};
  const email = validateEmail(text(form.email), errors);
  const password = text(form.password);
  if (password === "") errors.password = "Sisesta parool.";

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value: { email, password } };
}

export function parseSignUp(form: { email?: FormDataEntryValue | null; password?: FormDataEntryValue | null }): CredentialsResult {
  const errors: CredentialErrors = {};
  const email = validateEmail(text(form.email), errors);
  const password = text(form.password);
  if (password === "") errors.password = "Sisesta parool.";
  else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Parool peab olema vähemalt ${MIN_PASSWORD_LENGTH} märki.`;
  } else if (password.length > MAX_PASSWORD_LENGTH) {
    errors.password = `Parool võib olla kuni ${MAX_PASSWORD_LENGTH} märki.`;
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value: { email, password } };
}
