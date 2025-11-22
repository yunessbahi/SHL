"use client";

import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "@/tailwind.config.js";

const fullConfig = resolveConfig(tailwindConfig);
const COLORS = fullConfig.theme.colors;

// Predefined color combinations that work well in both light and dark themes
interface ColorCombination {
  bg: string;
  text: string;
  name: string;
  value: string;
}

const LIGHT_COLORS: ColorCombination[] = [
  { bg: "bg-blue-600", text: "text-white", name: "Blue", value: "blue-600" },
  { bg: "bg-green-600", text: "text-white", name: "Green", value: "green-600" },
  {
    bg: "bg-purple-600",
    text: "text-white",
    name: "Purple",
    value: "purple-600",
  },
  { bg: "bg-pink-600", text: "text-white", name: "Pink", value: "pink-600" },
  {
    bg: "bg-orange-600",
    text: "text-white",
    name: "Orange",
    value: "orange-600",
  },
  { bg: "bg-red-600", text: "text-white", name: "Red", value: "red-600" },
  {
    bg: "bg-indigo-600",
    text: "text-white",
    name: "Indigo",
    value: "indigo-600",
  },
  { bg: "bg-teal-600", text: "text-white", name: "Teal", value: "teal-600" },
  { bg: "bg-cyan-600", text: "text-white", name: "Cyan", value: "cyan-600" },
  { bg: "bg-gray-600", text: "text-white", name: "Gray", value: "gray-600" },
  { bg: "bg-amber-600", text: "text-white", name: "Amber", value: "amber-600" },
  {
    bg: "bg-yellow-600",
    text: "text-white",
    name: "Yellow",
    value: "yellow-600",
  },
  { bg: "bg-lime-600", text: "text-white", name: "Lime", value: "lime-600" },
  {
    bg: "bg-emerald-600",
    text: "text-white",
    name: "Emerald",
    value: "emerald-600",
  },
  { bg: "bg-sky-600", text: "text-white", name: "Sky", value: "sky-600" },
  {
    bg: "bg-violet-600",
    text: "text-white",
    name: "Violet",
    value: "violet-600",
  },
  {
    bg: "bg-fuchsia-600",
    text: "text-white",
    name: "Fuchsia",
    value: "fuchsia-600",
  },
  { bg: "bg-rose-600", text: "text-white", name: "Rose", value: "rose-600" },
  { bg: "bg-slate-600", text: "text-white", name: "Slate", value: "slate-600" },
  { bg: "bg-zinc-600", text: "text-white", name: "Zinc", value: "zinc-600" },
  {
    bg: "bg-neutral-600",
    text: "text-white",
    name: "Neutral",
    value: "neutral-600",
  },
  { bg: "bg-stone-600", text: "text-white", name: "Stone", value: "stone-600" },
];

const DARK_COLORS: ColorCombination[] = [
  { bg: "bg-blue-400", text: "text-blue-900", name: "Blue", value: "blue-400" },
  {
    bg: "bg-green-400",
    text: "text-green-900",
    name: "Green",
    value: "green-400",
  },
  {
    bg: "bg-purple-400",
    text: "text-purple-900",
    name: "Purple",
    value: "purple-400",
  },
  { bg: "bg-pink-400", text: "text-pink-900", name: "Pink", value: "pink-400" },
  {
    bg: "bg-orange-400",
    text: "text-orange-900",
    name: "Orange",
    value: "orange-400",
  },
  { bg: "bg-red-400", text: "text-red-900", name: "Red", value: "red-400" },
  {
    bg: "bg-indigo-400",
    text: "text-indigo-900",
    name: "Indigo",
    value: "indigo-400",
  },
  { bg: "bg-teal-400", text: "text-teal-900", name: "Teal", value: "teal-400" },
  { bg: "bg-cyan-400", text: "text-cyan-900", name: "Cyan", value: "cyan-400" },
  { bg: "bg-gray-400", text: "text-gray-900", name: "Gray", value: "gray-400" },
  {
    bg: "bg-amber-400",
    text: "text-amber-900",
    name: "Amber",
    value: "amber-400",
  },
  {
    bg: "bg-yellow-400",
    text: "text-yellow-900",
    name: "Yellow",
    value: "yellow-400",
  },
  { bg: "bg-lime-400", text: "text-lime-900", name: "Lime", value: "lime-400" },
  {
    bg: "bg-emerald-400",
    text: "text-emerald-900",
    name: "Emerald",
    value: "emerald-400",
  },
  { bg: "bg-sky-400", text: "text-sky-900", name: "Sky", value: "sky-400" },
  {
    bg: "bg-violet-400",
    text: "text-violet-900",
    name: "Violet",
    value: "violet-400",
  },
  {
    bg: "bg-fuchsia-400",
    text: "text-fuchsia-900",
    name: "Fuchsia",
    value: "fuchsia-400",
  },
  { bg: "bg-rose-400", text: "text-rose-900", name: "Rose", value: "rose-400" },
  {
    bg: "bg-slate-400",
    text: "text-slate-900",
    name: "Slate",
    value: "slate-400",
  },
  { bg: "bg-zinc-400", text: "text-zinc-900", name: "Zinc", value: "zinc-400" },
  {
    bg: "bg-neutral-400",
    text: "text-neutral-900",
    name: "Neutral",
    value: "neutral-400",
  },
  {
    bg: "bg-stone-400",
    text: "text-stone-900",
    name: "Stone",
    value: "stone-400",
  },
];

// Create mapping for corresponding colors
const lightToDark: { [key: string]: string } = {};
LIGHT_COLORS.forEach((c, i) => {
  lightToDark[c.value] = DARK_COLORS[i].value;
});
const darkToLight: { [key: string]: string } = {};
DARK_COLORS.forEach((c, i) => {
  darkToLight[c.value] = LIGHT_COLORS[i].value;
});

interface ThemeColors {
  light: string;
  dark: string;
}

interface TailwindColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function TailwindColorPicker({
  value,
  onChange,
}: TailwindColorPickerProps) {
  // Parse the value - it can be a simple color or a theme-based color object
  const parseValue = (val: string): ThemeColors => {
    try {
      const parsed = JSON.parse(val);
      if (parsed.light && parsed.dark) {
        return parsed;
      }
    } catch {
      // Not JSON, treat as legacy single color
    }
    // Default to same color for both themes
    return { light: val, dark: val };
  };

  const [themeColors, setThemeColors] = useState<ThemeColors>(() =>
    parseValue(value),
  );
  const [activeTheme, setActiveTheme] = useState<"light" | "dark">("light");

  const handleColorChange = (theme: "light" | "dark", colorValue: string) => {
    const newColors = { ...themeColors };
    newColors[theme] = colorValue;
    // Set the corresponding color for the other theme
    const oppositeTheme = theme === "light" ? "dark" : "light";
    const correspondingColor =
      theme === "light" ? lightToDark[colorValue] : darkToLight[colorValue];
    if (correspondingColor) {
      newColors[oppositeTheme] = correspondingColor;
    }
    setThemeColors(newColors);
    onChange(JSON.stringify(newColors));
  };

  const getCurrentColor = () => themeColors[activeTheme];
  const getPreviewCombination = (
    colorValue: string,
    theme: "light" | "dark",
  ) => {
    const colors = theme === "light" ? LIGHT_COLORS : DARK_COLORS;
    return colors.find((c) => c.value === colorValue) || colors[0];
  };

  const currentPreview = getPreviewCombination(getCurrentColor(), activeTheme);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-3">
          <span
            className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-medium ${currentPreview.bg} ${currentPreview.text}`}
          >
            T
          </span>
          Theme Colors Selected
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-4 space-y-4">
        {/* Theme Selector */}
        <div>
          <p className="text-sm font-medium mb-3">
            Select Colors for Each Theme
          </p>
          <div className="flex gap-2 mb-4">
            <button
              className={`flex-1 px-3 py-2 text-xs border rounded transition ${
                activeTheme === "light"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
              onClick={() => setActiveTheme("light")}
            >
              Light Theme
            </button>
            <button
              className={`flex-1 px-3 py-2 text-xs border rounded transition ${
                activeTheme === "dark"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
              onClick={() => setActiveTheme("dark")}
            >
              Dark Theme
            </button>
          </div>
        </div>

        {/* Color Selection */}
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {activeTheme === "light" ? "Light Theme" : "Dark Theme"} Colors
          </p>
          <ScrollArea className="h-48">
            <div
              className="grid grid-cols-2 gap-2 pr-3"
              onWheel={(e) => {
                // Allow smooth scrolling behavior
                const scrollArea = e.currentTarget.closest(
                  "[data-radix-scroll-area-viewport]",
                );
                if (scrollArea) {
                  const delta = e.deltaY;
                  const currentScroll = scrollArea.scrollTop;
                  const newScroll = Math.max(
                    0,
                    Math.min(
                      scrollArea.scrollHeight - scrollArea.clientHeight,
                      currentScroll + delta,
                    ),
                  );

                  scrollArea.scrollTo({
                    top: newScroll,
                    //behavior: "smooth",
                  });
                  e.preventDefault();
                }
              }}
            >
              {(activeTheme === "light" ? LIGHT_COLORS : DARK_COLORS).map(
                (combination) => (
                  <button
                    key={combination.value}
                    onClick={() =>
                      handleColorChange(activeTheme, combination.value)
                    }
                    className={`flex items-center gap-2 p-2 border rounded hover:bg-muted transition ${
                      getCurrentColor() === combination.value
                        ? "border-primary"
                        : ""
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded border flex items-center justify-center text-xs font-medium ${combination.bg} ${combination.text}`}
                    >
                      T
                    </span>
                    <span className="text-xs truncate">{combination.name}</span>
                  </button>
                ),
              )}
            </div>

            <ScrollBar orientation={"vertical"} />
          </ScrollArea>
        </div>

        {/* Preview */}
        <div className="border-t pt-3">
          <p className="text-sm font-medium mb-2">Preview</p>
          <div className="flex gap-2">
            <div className="flex-1 p-2 border rounded bg-white">
              <p className="text-xs text-muted-foreground mb-1">Light Theme</p>
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPreviewCombination(themeColors.light, "light").bg} ${getPreviewCombination(themeColors.light, "light").text}`}
              >
                Sample Tag
              </span>
            </div>
            <div className="flex-1 p-2 border rounded bg-gray-900">
              <p className="text-xs text-muted-foreground mb-1">Dark Theme</p>
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPreviewCombination(themeColors.dark, "dark").bg} ${getPreviewCombination(themeColors.dark, "dark").text}`}
              >
                Sample Tag
              </span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
