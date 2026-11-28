// HTTP headers that make the browser stricter with the app. Sent on every
// response by next.config.ts.

export type Header = { key: string; value: string };

export const SECURITY_HEADERS: Header[] = [
  // Use the type the server sends; never guess a script from a text file.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No other site may show the app in a frame (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Other sites see only the origin, never the path of the page.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The app needs none of these browser features.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // A window opened from another site cannot reach into the app.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];
