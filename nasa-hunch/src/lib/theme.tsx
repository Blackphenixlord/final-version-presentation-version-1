import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";

interface ThemeCtx { theme: Theme; toggle: () => void }

const Ctx = createContext<ThemeCtx>({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try { return (localStorage.getItem("theme") as Theme) || "dark"; } catch { return "dark"; }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme() { return useContext(Ctx); }

/** Theme-aware color tokens — use in inline style={{ }} objects.
 *  Each value is a CSS var() reference, resolved by data-theme attribute. */
export const T = {
  bg:       "var(--t-bg)",
  surface:  "var(--t-surface)",
  surface2: "var(--t-surface2)",
  surface3: "var(--t-surface3)",
  text:     "var(--t-text)",
  muted:    "var(--t-muted)",
  subtle:   "var(--t-subtle)",
  accent:   "var(--t-accent)",
  blue:     "var(--t-blue)",
  blue2:    "var(--t-blue2)",
  blue3:    "var(--t-blue3)",
  green:    "var(--t-green)",
  red:      "var(--t-red)",
  purple:   "var(--t-purple)",
} as const;
