// Turns Supabase Auth errors into Estonian messages. The raw error is
// logged on the server and never shown to the user.

export type AuthErrorLike = { code?: string; status?: number; message: string };

export const GENERIC_AUTH_ERROR = "Midagi läks valesti. Proovi uuesti.";

const MESSAGES: Record<string, string> = {
  invalid_credentials: "Vale e-post või parool.",
  email_not_confirmed: "Kinnita enne sisselogimist oma e-posti aadress (link on kirjas).",
  user_already_exists: "Selle e-postiga konto on juba olemas. Logi sisse.",
  email_exists: "Selle e-postiga konto on juba olemas. Logi sisse.",
  weak_password: "Parool on liiga nõrk. Vali pikem või keerulisem parool.",
  signup_disabled: "Uute kontode loomine on praegu suletud.",
  over_request_rate_limit: "Liiga palju katseid. Proovi mõne minuti pärast uuesti.",
  over_email_send_rate_limit: "Liiga palju kirju saadetud. Proovi mõne minuti pärast uuesti.",
};

export function authErrorMessage(error: AuthErrorLike, context: string): string {
  console.error(`[auth] ${context} failed`, error.code, error.status, error.message);
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];
  if (error.status === 429) return MESSAGES.over_request_rate_limit;
  return GENERIC_AUTH_ERROR;
}
