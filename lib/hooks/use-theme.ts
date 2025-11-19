"use client"; // This hook will be used in Client Components

import { useTheme as useNextTheme } from "next-themes";

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  return { theme, setTheme, resolvedTheme };
}
