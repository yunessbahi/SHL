import { Filter } from "lucide-react";
import React from "react";
import DiagramButton from "./DiagramButton";

interface VerticalFilterButtonProps
  extends React.ComponentPropsWithoutRef<"button"> {}

const VerticalFilterButton = React.forwardRef<
  HTMLButtonElement,
  VerticalFilterButtonProps
>((props, ref) => {
  return (
    <>
      <button
        ref={ref}
        {...props}
        className="h-full w-12 bg-card hover:bg-muted border-l border-border/40 rounded-md transition-colors duration-200 group relative"
        aria-label="Open Analytics Filters"
      >
        {/* Content Container */}
        <div className="relative h-full flex flex-col items-center justify-start gap-4 px-2">
          {/* Filter Icon */}
          <div className=" flex flex-col items-center p-1.5 mt-2 gap-2 h-[120px] bg-muted rounded-full group-hover:bg-white/10 transition-colors">
            <Filter
              className="w-5 h-5 mt-2 text-white/80 group-hover:text-white transition-colors"
              strokeWidth={2}
            />
            {/* Vertical Text */}
            <div className="flex-1 flex items-center justify-center">
              <div
                style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
              >
                <span className="whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  Filters
                </span>
              </div>
            </div>
          </div>
        </div>
      </button>
    </>
  );
});

VerticalFilterButton.displayName = "VerticalFilterButton";

// Main component that contains both Diagram and Filter buttons
interface FilterTriggerButtonProps {
  onDiagramClick?: () => void;
  onFilterClick?: () => void;
}

const FilterTriggerButton: React.FC<FilterTriggerButtonProps> = ({
  onDiagramClick,
  onFilterClick,
}) => {
  return (
    <div className="flex flex-col h-[240px] w-12 bg-card border-l border-border/40 rounded-md">
      {/* Diagram Button - Top */}
      <div className="flex-1">
        <DiagramButton
          onClick={onDiagramClick}
          className="h-full w-full border-none rounded-none rounded-t-md"
          aria-label="Open Analytics Diagram"
        />
      </div>

      {/* Filter Button - Bottom */}
      <div className="flex-1">
        <VerticalFilterButton
          onClick={onFilterClick}
          className="h-full w-full border-none rounded-none rounded-b-md border-t border-border/40"
          aria-label="Open Analytics Filters"
        />
      </div>
    </div>
  );
};

FilterTriggerButton.displayName = "FilterTriggerButton";

export default FilterTriggerButton;
export { VerticalFilterButton };
