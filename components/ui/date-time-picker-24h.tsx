"use client";

import * as React from "react";
//import { CalendarIcon } from "@radix-ui/react-icons";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function DateTimePicker24h({
  label,
  value,
  onChange,
  className,
}: {
  label?: string;
  value: string | undefined;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  // Convert string value to Date object for the picker
  const dateValue = value ? new Date(value) : undefined;

  function handleDateSelect(date: Date | undefined) {
    if (date) {
      const newDate = new Date(date);
      // Preserve existing time if we have one
      if (dateValue) {
        newDate.setHours(dateValue.getHours());
        newDate.setMinutes(dateValue.getMinutes());
      } else {
        // Default to current time if no time is set
        const now = new Date();
        newDate.setHours(now.getHours());
        newDate.setMinutes(now.getMinutes());
      }

      // Preserve timezone information in the ISO string
      const timezoneOffset = -newDate.getTimezoneOffset(); // getTimezoneOffset returns negative value
      const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
      const offsetMinutes = Math.abs(timezoneOffset) % 60;
      const offsetSign = timezoneOffset >= 0 ? "+" : "-";
      const offsetString = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;

      const year = newDate.getFullYear();
      const month = String(newDate.getMonth() + 1).padStart(2, "0");
      const day = String(newDate.getDate()).padStart(2, "0");
      const hours = String(newDate.getHours()).padStart(2, "0");
      const minutes = String(newDate.getMinutes()).padStart(2, "0");

      const isoStringWithTZ = `${year}-${month}-${day}T${hours}:${minutes}:00${offsetString}`;
      onChange(isoStringWithTZ);
    }
  }

  function handleTimeChange(type: "hour" | "minute", timeValue: string) {
    const currentDate = dateValue || new Date();
    const newDate = new Date(currentDate);

    if (type === "hour") {
      const hour = parseInt(timeValue, 10);
      newDate.setHours(hour);
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(timeValue, 10));
    }

    // Preserve timezone information in the ISO string
    const timezoneOffset = -newDate.getTimezoneOffset(); // getTimezoneOffset returns negative value
    const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const offsetMinutes = Math.abs(timezoneOffset) % 60;
    const offsetSign = timezoneOffset >= 0 ? "+" : "-";
    const offsetString = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;

    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, "0");
    const day = String(newDate.getDate()).padStart(2, "0");
    const hours = String(newDate.getHours()).padStart(2, "0");
    const minutes = String(newDate.getMinutes()).padStart(2, "0");

    const isoStringWithTZ = `${year}-${month}-${day}T${hours}:${minutes}:00${offsetString}`;
    onChange(isoStringWithTZ);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full pl-3 text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            {value ? (
              format(dateValue!, "MM/dd/yyyy HH:mm")
            ) : (
              <span>MM/DD/YYYY HH:mm</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <div className="sm:flex">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={handleDateSelect}
              initialFocus
            />
            <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex sm:flex-col p-2">
                  {Array.from({ length: 24 }, (_, i) => i)
                    .reverse()
                    .map((hour) => (
                      <Button
                        key={hour}
                        size="icon"
                        variant={
                          dateValue && dateValue.getHours() === hour
                            ? "primary"
                            : "ghost"
                        }
                        className="sm:w-full shrink-0 aspect-square"
                        onClick={() =>
                          handleTimeChange("hour", hour.toString())
                        }
                      >
                        {hour}
                      </Button>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex sm:flex-col p-2">
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                    <Button
                      key={minute}
                      size="icon"
                      variant={
                        dateValue && dateValue.getMinutes() === minute
                          ? "primary"
                          : "ghost"
                      }
                      className="sm:w-full shrink-0 aspect-square"
                      onClick={() =>
                        handleTimeChange("minute", minute.toString())
                      }
                    >
                      {minute.toString().padStart(2, "0")}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
