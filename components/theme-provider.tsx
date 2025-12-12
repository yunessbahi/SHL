"use client"; // This component will be a Client Component

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
  [key: string]: any;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="shl-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
