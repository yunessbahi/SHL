import React, { useState } from "react";

export default function ThemeToggleSwitch() {
  const [isDark, setIsDark] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-8">
      <div className="space-y-12">
        <ThemeToggle isDark={isDark} onChange={setIsDark} />
      </div>
    </div>
  );
}

export function ThemeToggle({
  isDark,
  onChange,
}: {
  isDark: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!isDark)}
      className={`
        relative block w-32 h-16 flex-0 scale-50 -m-3 rounded-full p-1 transition-all duration-500 ease-in-out overflow-visible
        ${
          isDark
            ? "bg-gradient-to-br from-gray-800 to-gray-900"
            : "bg-gradient-to-br from-gray-200 to-gray-300"
        }
        shadow-[0_8px_32px_rgba(0,0,0,0.1)]
        ${isDark ? "shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)]" : "shadow-[inset_0_2px_8px_rgba(0,0,0,0.08)]"}
      `}
      aria-label="Toggle theme"
    >
      {/* Moon and Stars Decoration - Left Side (Dark Mode) */}
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
            {/* Crescent Moon */}
            <path d="M1927.317,1054.792c-63.412,301.248-330.699,527.391-650.811,527.391c-366.778,0-665.084-298.305-665.084-665.084c0-320.111,226.143-587.399,527.391-650.811c12.918-2.719,20.043,14.541,8.951,21.699c-151.246,97.596-251.381,267.601-251.381,460.991c-0.001,302.903,245.342,548.245,548.244,548.245c193.39,0,363.395-100.135,460.991-251.381C1912.776,1034.749,1930.036,1041.874,1927.317,1054.792z" />
            {/* Stars */}
            <path d="M1491.855,565.276c-131.511,15.564-144.128,28.181-159.692,159.692c-15.564-131.511-28.181-144.128-159.692-159.692c131.511-15.564,144.128-28.181,159.692-159.692C1347.727,537.095,1360.344,549.712,1491.855,565.276z" />
            <path d="M501.591,1100.75c-131.511,15.564-144.128,28.181-159.692,159.692c-15.564-131.511-28.181-144.128-159.692-159.692c131.511-15.564,144.128-28.181,159.692-159.692C357.463,1072.569,370.08,1085.186,501.591,1100.75z" />
            <path d="M2017.793,1585.006c-131.511,15.564-144.128,28.181-159.692,159.692c-15.564-131.511-28.181-144.128-159.692-159.692c131.511-15.564,144.128-28.181,159.692-159.692C1873.665,1556.825,1886.282,1569.442,2017.793,1585.006z" />
            <path d="M941.808,1774.308C810.297,1789.872,797.68,1802.489,782.116,1934c-15.564-131.511-28.181-144.128-159.692-159.692c131.511-15.564,144.128-28.181,159.692-159.692C797.68,1746.127,810.297,1758.744,941.808,1774.308z" />
            <path d="M1829.098,475.982c-46.945,5.556-51.449,10.06-57.005,57.005c-5.556-46.945-10.06-51.449-57.005-57.005c46.945-5.556,51.449-10.06,57.005-57.005C1777.649,465.923,1782.153,470.427,1829.098,475.982z" />
            <path d="M1443.35,1742.769c-46.945,5.556-51.449,10.06-57.005,57.005c-5.556-46.945-10.06-51.449-57.005-57.005c46.945-5.556,51.449-10.06,57.005-57.005C1391.901,1732.71,1396.405,1737.213,1443.35,1742.769z" />
            <path d="M1382.612,945.37c-85.911,10.167-94.154,18.41-104.321,104.321c-10.167-85.911-18.41-94.154-104.321-104.321c85.911-10.167,94.154-18.41,104.321-104.321C1288.459,926.961,1296.701,935.203,1382.612,945.37z" />
            <path d="M1754.377,834.646c-85.911,10.167-94.154,18.41-104.321,104.321c-10.167-85.911-18.41-94.154-104.321-104.321c85.911-10.167,94.154-18.41,104.321-104.321C1660.224,816.237,1668.466,824.479,1754.377,834.646z" />
            <path d="M595.35,612.611c-64.586,7.644-70.782,13.84-78.426,78.426c-7.644-64.586-13.84-70.782-78.426-78.426c64.586-7.643,70.782-13.84,78.426-78.426C524.567,598.771,530.764,604.967,595.35,612.611z" />
            <path d="M679.874,1460.897c-64.586,7.644-70.782,13.84-78.426,78.426c-7.644-64.586-13.84-70.782-78.426-78.426c64.586-7.644,70.782-13.84,78.426-78.426C609.091,1447.058,615.288,1453.254,679.874,1460.897z" />
          </g>
        </svg>
      </div>

      {/* Sun Decoration - Right Side (Light Mode) */}
      <div
        className={`
        absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12
        transition-all duration-500 ease-in-out
        ${isDark ? "opacity-0 scale-75" : "opacity-30 scale-100"}
      `}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <g className="fill-gray-400">
            {/* Sun center circle */}
            <circle cx="50" cy="50" r="20" />
            {/* Sun rays */}
            <g>
              <rect x="48" y="10" width="4" height="12" rx="2" />
              <rect x="48" y="78" width="4" height="12" rx="2" />
              <rect x="10" y="48" width="12" height="4" ry="2" />
              <rect x="78" y="48" width="12" height="4" ry="2" />
              <rect
                x="21"
                y="21"
                width="4"
                height="12"
                rx="2"
                transform="rotate(-45 23 27)"
              />
              <rect
                x="75"
                y="21"
                width="4"
                height="12"
                rx="2"
                transform="rotate(45 77 27)"
              />
              <rect
                x="21"
                y="75"
                width="4"
                height="12"
                rx="2"
                transform="rotate(45 23 81)"
              />
              <rect
                x="75"
                y="75"
                width="4"
                height="12"
                rx="2"
                transform="rotate(-45 77 81)"
              />
            </g>
          </g>
        </svg>
      </div>

      {/* Toggle Knob */}
      <div
        className={`
          relative w-14 h-14 rounded-full transition-all duration-500 ease-in-out z-10
          transform
          ${isDark ? "translate-x-16" : "translate-x-0"}
          ${
            isDark
              ? "bg-gradient-to-br from-gray-600 to-gray-700"
              : "bg-gradient-to-br from-white to-gray-100"
          }
          shadow-[0_4px_16px_rgba(0,0,0,0.15)]
          ${isDark ? "shadow-[0_4px_20px_rgba(0,0,0,0.4)]" : "shadow-[0_4px_16px_rgba(0,0,0,0.12)]"}
        `}
      >
        {/* Inner shadow effect */}
        <div
          className={`
          absolute inset-0 rounded-full
          ${
            isDark
              ? "shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
              : "shadow-[inset_0_-1px_3px_rgba(0,0,0,0.05)]"
          }
        `}
        ></div>
      </div>
    </button>
  );
}
