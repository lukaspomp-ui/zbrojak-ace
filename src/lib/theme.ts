import { useEffect, useState } from "react";

export type ThemeMode = "dark" | "light" | "system";

const KEY = "zbrojak:theme";
const EVT = "zbrojak:theme-change";

export function getThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "light" || v === "system" ? v : "dark";
  } catch {
    return "dark";
  }
}

function systemIsLight(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  );
}

/** Toggle the html classes so the CSS variables (and Tailwind dark: variant) flip. */
export function applyTheme(mode: ThemeMode = getThemeMode()) {
  if (typeof document === "undefined") return;
  const light = mode === "light" || (mode === "system" && systemIsLight());
  const el = document.documentElement;
  el.classList.toggle("light", light);
  el.classList.toggle("dark", !light);
}

export function setThemeMode(mode: ThemeMode) {
  try {
    window.localStorage.setItem(KEY, mode);
  } catch {
    /* best-effort */
  }
  applyTheme(mode);
  window.dispatchEvent(new Event(EVT));
}

export function useTheme(): {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
} {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    setMode(getThemeMode());
    applyTheme();
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onSystem = () => {
      if (getThemeMode() === "system") applyTheme("system");
    };
    const onChange = () => setMode(getThemeMode());
    media.addEventListener?.("change", onSystem);
    window.addEventListener(EVT, onChange);
    return () => {
      media.removeEventListener?.("change", onSystem);
      window.removeEventListener(EVT, onChange);
    };
  }, []);

  return {
    mode,
    setMode: (m) => {
      setThemeMode(m);
      setMode(m);
    },
  };
}
