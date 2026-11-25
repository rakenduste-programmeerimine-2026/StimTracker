// Dark is the default. The choice is kept in localStorage and applied as
// <html data-theme="light"> before the page paints (see THEME_INIT_SCRIPT),
// so a light-theme user never sees a dark flash. No React imports here:
// the layout (a server component) imports the constants.

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "stimtracker.theme";
export const THEME_COLOR: Record<Theme, string> = { dark: "#14121f", light: "#f4f2fa" };

// Runs inline in <head>, so it must stay plain ES5-safe JavaScript.
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="light"){document.documentElement.dataset.theme="light"}}catch(e){}`;

const listeners = new Set<() => void>();

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function setTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "light") root.dataset.theme = "light";
  else delete root.dataset.theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked: the theme still applies until reload.
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
  listeners.forEach((listener) => listener());
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
