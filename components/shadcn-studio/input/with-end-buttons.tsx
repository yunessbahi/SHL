"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface NumberStepperProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export function NumberStepper({
  value,
  onChange,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  disabled = false,
}: NumberStepperProps) {
  const handleDecrement = () => {
    if (disabled) return;
    const next = value - step;
    if (next < min) {
      onChange(min);
    } else {
      onChange(next);
    }
  };

  const handleIncrement = () => {
    if (disabled) return;
    const next = value + step;
    if (next > max) {
      onChange(max);
    } else {
      onChange(next);
    }
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const val = e.target.value;
    const parsed = Number(val);
    if (!isNaN(parsed)) {
      // clamp
      if (parsed < min) onChange(min);
      else if (parsed > max) onChange(max);
      else onChange(parsed);
    } else {
      // if empty or invalid, you may decide what to do
      onChange(min);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Input
        type="number"
        value={value}
        onChange={handleChange}
        className="w-16 text-center"
        disabled={disabled}
        min={min}
        max={max}
        step={step}
      />
      <Button
        variant="outline"
        size={"icon"}
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="Decrease value"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size={"icon"}
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label="Increase value rounded-full p-0"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
