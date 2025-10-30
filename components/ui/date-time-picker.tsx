"use client";

import * as React from "react";
import { parseDate } from "chrono-node";
import { CalendarIcon, ClockIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatISODateTime(date: Date | undefined) {
  if (!date) return "";
  return date.toISOString();
}

export function DateTimePicker({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined,
  );
  const [month, setMonth] = React.useState<Date | undefined>(date);
  const [hour, setHour] = React.useState<string>("");
  const [minute, setMinute] = React.useState<string>("");

  React.useEffect(() => {
    const newDate = value ? new Date(value) : undefined;
    const newMonth = newDate;
    const newInputValue = formatDate(newDate);
    const newHour = newDate?.getHours().toString().padStart(2, "0") || "";
    const newMinute = newDate?.getMinutes().toString().padStart(2, "0") || "";

    // Only update state if values actually changed to prevent infinite loops
    if (newDate?.getTime() !== date?.getTime()) {
      setDate(newDate);
    }
    if (newMonth?.getTime() !== month?.getTime()) {
      setMonth(newMonth);
    }
    if (newInputValue !== inputValue) {
      setInputValue(newInputValue);
    }
    if (newHour !== hour) {
      setHour(newHour);
    }
    if (newMinute !== minute) {
      setMinute(newMinute);
    }
  }, [value, date, month, inputValue, hour, minute]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    const parsedDate = parseDate(newValue);
    if (parsedDate) {
      setDate(parsedDate);
      setMonth(parsedDate);
      setHour(parsedDate.getHours().toString().padStart(2, "0"));
      setMinute(parsedDate.getMinutes().toString().padStart(2, "0"));
      onChange(formatISODateTime(parsedDate));
    }
  };

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      if (hour) newDate.setHours(parseInt(hour));
      if (minute) newDate.setMinutes(parseInt(minute));
      setDate(newDate);
      setInputValue(formatDate(newDate));
      onChange(formatISODateTime(newDate));
    } else {
      setDate(undefined);
      setInputValue("");
      onChange("");
    }
  };

  const handleTimeChange = (type: "hour" | "minute", val: string) => {
    if (type === "hour") {
      setHour(val);
    } else {
      setMinute(val);
    }
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(parseInt(type === "hour" ? val : hour || "0"));
      newDate.setMinutes(parseInt(type === "minute" ? val : minute || "0"));
      setDate(newDate);
      setInputValue(formatDate(newDate));
      onChange(formatISODateTime(newDate));
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <Label htmlFor="datetime" className="px-1">
          {label}
        </Label>
      )}
      <div className="relative flex gap-2">
        <Input
          id="datetime"
          value={inputValue}
          placeholder="Tomorrow or next week"
          className="bg-background pr-10"
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="datetime-picker"
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date and time</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="end">
            <div className="p-3">
              <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                month={month}
                onMonthChange={setMonth}
                onSelect={handleCalendarSelect}
              />
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <ClockIcon className="size-4 text-muted-foreground" />
                <div className="flex gap-1">
                  <Select
                    value={hour}
                    onValueChange={(val) => handleTimeChange("hour", val)}
                  >
                    <SelectTrigger className="w-16">
                      <SelectValue placeholder="HH" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">:</span>
                  <Select
                    value={minute}
                    onValueChange={(val) => handleTimeChange("minute", val)}
                  >
                    <SelectTrigger className="w-16">
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent>
                      {minutes.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
