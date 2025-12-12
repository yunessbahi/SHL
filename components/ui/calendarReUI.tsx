"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayButton, DayPicker } from "react-day-picker";

function CalendarReUI({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col sm:flex-row gap-4",
        month: "w-full",
        month_caption:
          "relative mx-10 mb-1 flex h-8 items-center justify-center z-20",
        caption_label: "text-sm font-medium",
        nav: "absolute top-0 flex w-full justify-between z-10",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 text-muted-foreground/80 hover:text-foreground p-0",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 text-muted-foreground/80 hover:text-foreground p-0",
        ),
        weekday: "size-8 p-0 text-xs font-medium text-muted-foreground/80",
        day_button:
          "cursor-pointer relative flex size-8 items-center justify-center whitespace-nowrap p-0 text-foreground transition-200 data-[selected]:not(.range-middle):[transition-property:color,background-color,border-radius,box-shadow] data-[selected]:not(.range-middle):duration-150 data-disabled:pointer-events-none focus-visible:z-10 hover:not([data-selected]):bg-accent data-[selected]:bg-primary hover:not([data-selected]):text-foreground data-[selected]:text-primary-foreground data-disabled:text-foreground/30 data-disabled:line-through data-outside:text-foreground/30 data-[selected]:data-outside:text-primary-foreground outline-none focus-visible:ring-ring/50 focus-visible:ring-0 [.range-middle]:data-[selected]:bg-accent [.range-middle]:data-[selected]:text-foreground",
        day: "group size-8 px-0 py-px text-sm",
        range_start: "range-start",
        range_end: "range-end",
        range_middle: "range-middle",
        today:
          "*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-10 *:after:size-[3px] *:after:-translate-x-1/2 rtl:*:after:translate-x-1/2 *:after:rounded-full *:after:bg-primary [&[data-selected]:not(.range-middle)>*]:after:bg-background [&[data-disabled]>*]:after:bg-foreground/30 *:after:transition-colors",
        outside:
          "text-muted-foreground data-selected:bg-accent/50 data-selected:text-muted-foreground",
        hidden: "invisible",
        week_number: "size-8 p-0 text-xs font-medium text-muted-foreground/80",
        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === "left") {
            return <ChevronLeft className="h-4 w-4 rtl:rotate-180" />;
          } else {
            return <ChevronRight className="h-4 w-4 rtl:rotate-180" />;
          }
        },
        DayButton: CalendarReUIDayButton,
      }}
      {...props}
    />
  );
}

function CalendarReUIDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const borderRadiusClass = React.useMemo(() => {
    if (modifiers.range_start && modifiers.range_end) {
      return "rounded-md";
    } else if (modifiers.range_start) {
      return "rounded-l-md rounded-r-none";
    } else if (modifiers.range_end) {
      return "rounded-r-md rounded-l-none";
    }
    return "";
  }, [modifiers.range_start, modifiers.range_end]);

  return (
    <button
      data-selected={modifiers.selected}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      data-outside={modifiers.outside}
      data-disabled={modifiers.disabled}
      className={cn(
        "cursor-pointer relative flex size-8 items-center justify-center whitespace-nowrap p-0 text-foreground transition-200 data-[selected]:not(.range-middle):[transition-property:color,background-color,border-radius,box-shadow] data-[selected]:not(.range-middle):duration-150 data-disabled:pointer-events-none focus-visible:z-10 hover:not([data-selected]):bg-accent data-[selected]:bg-primary hover:not([data-selected]):text-foreground data-[selected]:text-primary-foreground data-disabled:text-foreground/30 data-disabled:line-through data-outside:text-foreground/30 data-[selected]:data-outside:text-primary-foreground outline-none focus-visible:ring-ring/50 focus-visible:ring-0 [.range-middle]:data-[selected]:bg-accent [.range-middle]:data-[selected]:text-foreground",
        borderRadiusClass,
        className,
      )}
      {...props}
    />
  );
}

export { CalendarReUI };
