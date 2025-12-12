"use client";

import * as React from "react";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { format } from "date-fns";

import { Input } from "@/components/ui/input";

interface CalendarWithTimeInputProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CalendarWithTimeInput({
  value,
  onChange,
  placeholder = "Pick a date and time",
  disabled = false,
}: CalendarWithTimeInputProps) {
  // Internal state uses simple strings to avoid Date object reference issues
  const [dateInput, setDateInput] = React.useState("");
  const [timeInput, setTimeInput] = React.useState("");

  // Sync with external value prop - only when it actually changes
  React.useEffect(() => {
    if (value) {
      // Use date-fns format for consistent string representation
      const dateStr = format(value, "yyyy-MM-dd");
      const timeStr = format(value, "HH:mm");

      setDateInput(dateStr);
      setTimeInput(timeStr);
    } else {
      setDateInput("");
      setTimeInput("");
    }
  }, [value?.toISOString()]); // Use toISOString() for stable comparison

  const handleDateChange = (dateStr: string) => {
    setDateInput(dateStr);

    // Combine date and time if both exist
    if (dateStr && timeInput) {
      const combinedDate = new Date(`${dateStr}T${timeInput}:00`);
      onChange?.(combinedDate);
    } else if (!dateStr && !timeInput) {
      onChange?.(undefined);
    }
  };

  const handleTimeChange = (timeStr: string) => {
    setTimeInput(timeStr);

    // Combine date and time if both exist
    if (dateInput && timeStr) {
      const combinedDate = new Date(`${dateInput}T${timeStr}:00`);
      onChange?.(combinedDate);
    } else if (!dateInput && !timeStr) {
      onChange?.(undefined);
    }
  };

  const displayValue = () => {
    if (dateInput && timeInput) {
      const combinedDate = new Date(`${dateInput}T${timeInput}:00`);
      return format(combinedDate, "PPP 'at' p");
    } else if (dateInput) {
      const combinedDate = new Date(`${dateInput}T00:00:00`);
      return format(combinedDate, "PPP");
    }
    return placeholder;
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {/* Date Input */}
        <div className="relative">
          <Input
            type="date"
            value={dateInput}
            onChange={(e) => handleDateChange(e.target.value)}
            disabled={disabled}
            className="pl-9"
          />
          <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3">
            <CalendarIcon size={16} aria-hidden="true" />
          </div>
        </div>

        {/* Time Input */}
        <div className="relative">
          <Input
            type="time"
            value={timeInput}
            onChange={(e) => handleTimeChange(e.target.value)}
            disabled={disabled}
            className="pl-9"
            step="60" // Only allow minute precision
          />
          <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3">
            <ClockIcon size={16} aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Display current value */}
      <div className="text-sm text-muted-foreground min-h-[1.25rem]">
        {displayValue()}
      </div>
    </div>
  );
}
