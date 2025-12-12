import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind class names, resolving any conflicts.
 *
 * @param inputs - An array of class names to merge.
 * @returns A string of merged and optimized class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + "...";
}

export function toTitleCase(text: string): string {
  if (!text) return "";

  return text
    .replace(/[_-]+/g, " ") // replace underscores/dashes with spaces
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize each word
}

export function toUpper(text: string): string {
  if (!text) return "";

  return text
    .replace(/[_-]+/g, " ") // replace underscores/dashes with spaces
    .trim()
    .toUpperCase(); // make all text uppercase
}
