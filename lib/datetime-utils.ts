/**
 * DateTime Utilities for consistent timezone handling
 * Ensures all dates are displayed and stored in UTC consistently
 */

/**
 * Convert UTC ISO string to local date string for display
 * This is what should be used everywhere for displaying dates to users
 */
export function formatDateForDisplay(
  isoString: string | null | undefined,
): string {
  if (!isoString) return "Never";

  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  } catch {
    return "Invalid date";
  }
}

/**
 * Format date for form inputs (datetime-local format)
 * Returns YYYY-MM-DDTHH:MM format
 */
export function formatDateForInput(
  isoString: string | null | undefined,
): string {
  if (!isoString) return "";

  try {
    const date = new Date(isoString);
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    return date.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

/**
 * Convert datetime-local value to ISO string for API
 * Handles local timezone conversion to UTC
 */
export function formatInputToISO(inputValue: string | null): string | null {
  if (!inputValue) return null;

  try {
    // Parse the datetime-local value as local time and convert to UTC ISO
    const date = new Date(inputValue);
    return date.toISOString();
  } catch {
    return null;
  }
}

/**
 * Get current datetime in ISO format for API
 */
export function getCurrentISO(): string {
  return new Date().toISOString();
}
