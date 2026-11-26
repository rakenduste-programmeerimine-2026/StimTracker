// Which pages need a signed-in user. The middleware asks redirectFor() on
// every request and sends the browser elsewhere when the answer is a path.

export const LOGIN_PATH = "/login";
export const HOME_PATH = "/";

// Pages a signed-out user may open. Everything else in the app is private.
const PUBLIC_PATHS = [LOGIN_PATH];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export type RouteRequest = {
  pathname: string;
  signedIn: boolean;
  // A Server Action call (Next.js marks it with the Next-Action header).
  isServerAction: boolean;
};

// Where to send the user instead, or null to let the request through.
// Server Action calls are never redirected: a redirect would break their
// response, and they answer "Logi sisse ..." themselves because row level
// security refuses a user without a session.
export function redirectFor({ pathname, signedIn, isServerAction }: RouteRequest): string | null {
  if (isServerAction) return null;

  const isPublic = isPublicPath(pathname);
  if (!signedIn && !isPublic) return LOGIN_PATH;
  if (signedIn && isPublic) return HOME_PATH;
  return null;
}
