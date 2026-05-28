"use client";

import { useEffect } from "react";

import { useUIStore } from "@/store/uiStore";

export function useTheme() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  useEffect(() => {
    const root = document.documentElement;
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    root.classList.toggle("dark", resolved === "dark");
  }, [theme]);

  return { theme, setTheme };
}
