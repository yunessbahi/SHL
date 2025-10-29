"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ClockIcon } from "lucide-react";
import { useId } from "react";
import { Label } from "@/app/components/ui/label";
import { Separator } from "@/components/ui/separator";

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
  const [date, setDate] = React.useState<Date | undefined>(value);
  const [time, setTime] = React.useState<string>("");
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (value) {
      setDate(value);
      setTime(format(value, "HH:mm"));
    } else {
      setDate(undefined);
      setTime("");
    }
  }, [value]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      if (time) {
        const [hours, minutes] = time.split(":");
        newDate.setHours(parseInt(hours), parseInt(minutes));
      }
      setDate(newDate);
      onChange?.(newDate);
    } else {
      setDate(undefined);
      setTime("");
      onChange?.(undefined);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (date) {
      const [hours, minutes] = newTime.split(":");
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      setDate(newDate);
      onChange?.(newDate);
    } else if (newTime) {
      // If no date but time is set, create a date with current date
      const today = new Date();
      const [hours, minutes] = newTime.split(":");
      today.setHours(parseInt(hours), parseInt(minutes));
      setDate(today);
      onChange?.(today);
    }
  };

  const displayValue = date ? (time ? format(date, "PPP 'at' p") : format(date, "PPP")) : placeholder;
  const id = useId();
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
          <Separator orientation={"horizontal"} className="mb-3" />
          <div className="flex items-center gap-2 px-3 !pb-3">
            <Label htmlFor={id} className="text-xs">
              Enter time
            </Label>
            <div className="relative grow">
              <Input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="peer appearance-none pl-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none justify-end"
              />
              <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50">
                <ClockIcon size={16} aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
