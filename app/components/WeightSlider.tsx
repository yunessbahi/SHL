"use client";

import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

export default function WeightSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm mb-1">Weight: {value}</label>
      <Slider
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        max={100}
        min={1}
        step={1}
        className={cn("w-full")}
      />
    </div>
  );
}
