"use client";

import { useTheme } from "@/lib/hooks/use-theme";
import { ClientOnly } from "./client-only";

export default function ThemeToggleSwitch() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-8">
      <div className="space-y-12">
        <ThemeToggle />
      </div>
    </div>
  );
}

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <ClientOnly>
      <button
        onClick={handleToggle}
        className={`
          relative block w-32 h-16 flex-0 scale-50 -m-3 rounded-full p-1 transition-all duration-500 ease-in-out overflow-visible
          ${isDark ? "bg-gradient-to-br from-gray-800 to-gray-900" : "bg-gradient-to-br from-gray-200 to-gray-300"}
          shadow-[0_8px_32px_rgba(0,0,0,0.1)]
          ${isDark ? "shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)]" : "shadow-[inset_0_2px_8px_rgba(0,0,0,0.08)]"}
        `}
        aria-label="Toggle theme"
      >
        {/* Moon Decoration */}
        <div
          className={`
            absolute left-0 top-1/2 w-16 h-16
            transition-all duration-500 ease-in-out
            ${isDark ? "opacity-30 scale-100" : "opacity-0 scale-75"}
          `}
          style={{ transform: "translateY(calc(-50% + 5px))" }}
        >
          <svg viewBox="0 0 2200 2200" className="w-full h-full">
            <g className="fill-gray-400">
              <path d="M1927.317,1054.792c-63.412,301.248-330.699,527.391-650.811,527.391c-366.778,0-665.084-298.305-665.084-665.084c0-320.111,226.143-587.399,527.391-650.811c12.918-2.719,20.043,14.541,8.951,21.699c-151.246,97.596-251.381,267.601-251.381,460.991c-0.001,302.903,245.342,548.245,548.244,548.245c193.39,0,363.395-100.135,460.991-251.381C1912.776,1034.749,1930.036,1041.874,1927.317,1054.792z" />
              <path d="M1491.855,565.276c-131.511,15.564-144.128,28.181-159.692,159.692c-15.564-131.511-28.181-144.128-159.692-159.692c131.511-15.564,144.128-28.181,159.692-159.692C1347.727,537.095,1360.344,549.712,1491.855,565.276z" />
              <path d="M501.591,1100.75c-131.511,15.564-144.128,28.181-159.692,159.692c-15.564-131.511-28.181-144.128-159.692-159.692c131.511-15.564,144.128-28.181,159.692-159.692C357.463,1072.569,370.08,1085.186,501.591,1100.75z" />
              <path d="M2017.793,1585.006c-131.511,15.564-144.128,28.181-159.692,159.692c-15.564-131.511-28.181-144.128-159.692-159.692c131.511-15.564,144.128-28.181,159.692-159.692C1873.665,1556.825,1886.282,1569.442,2017.793,1585.006z" />
            </g>
          </svg>
        </div>

        {/* Sun Decoration */}
        <div
          className={`
            absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12
            transition-all duration-500 ease-in-out
            ${isDark ? "opacity-0 scale-75" : "opacity-30 scale-100"}
          `}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <g className="fill-gray-400">
              <circle cx="50" cy="50" r="20" />
              <rect x="48" y="10" width="4" height="12" rx="2" />
              <rect x="48" y="78" width="4" height="12" rx="2" />
              <rect x="10" y="48" width="12" height="4" ry="2" />
              <rect x="78" y="48" width="12" height="4" ry="2" />
            </g>
          </svg>
        </div>

        {/* Toggle Knob */}
        <div
          className={`
            relative w-14 h-14 rounded-full transition-all duration-500 ease-in-out z-10
            transform
            ${isDark ? "translate-x-16" : "translate-x-0"}
            ${isDark ? "bg-gradient-to-br from-gray-600 to-gray-700" : "bg-gradient-to-br from-white to-gray-100"}
            shadow-[0_4px_16px_rgba(0,0,0,0.15)]
            ${isDark ? "shadow-[0_4px_20px_rgba(0,0,0,0.4)]" : "shadow-[0_4px_16px_rgba(0,0,0,0.12)]"}
          `}
        >
          <div
            className={`
              absolute inset-0 rounded-full
              ${isDark ? "shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]" : "shadow-[inset_0_-1px_3px_rgba(0,0,0,0.05)]"}
            `}
          ></div>
        </div>
      </button>
    </ClientOnly>
  );
}
