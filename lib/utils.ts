import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
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
