"use client";
import React from "react";

export default function DateTimePicker({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (!inputValue) {
      onChange("");
      return;
    }

    try {
      // Parse the datetime-local value and preserve local timezone information
      const date = new Date(inputValue);

      // Convert to ISO string while preserving the original timezone offset
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      // Create ISO string with timezone offset preserved
      const timezoneOffset = -date.getTimezoneOffset(); // getTimezoneOffset returns negative value
      const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
      const offsetMinutes = Math.abs(timezoneOffset) % 60;
      const offsetSign = timezoneOffset >= 0 ? "+" : "-";
      const offsetString = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;

      const isoString = `${year}-${month}-${day}T${hours}:${minutes}:00${offsetString}`;
      onChange(isoString);
    } catch (error) {
      console.error("Error parsing datetime:", error);
      // Fallback to original behavior if parsing fails
      onChange(inputValue ? new Date(inputValue).toISOString() : "");
    }
  };

  // Convert ISO string back to datetime-local format for display
  const displayValue = value
    ? value.replace(/\+\d{2}:\d{2}$/, "").replace("Z", "")
    : "";

  return (
    <div>
      {label && <label className="block text-sm mb-1">{label}</label>}
      <input
        type="datetime-local"
        className="w-full border p-3 rounded-md text-base touch-manipulation"
        value={displayValue}
        onChange={handleChange}
      />
    </div>
  );
}
