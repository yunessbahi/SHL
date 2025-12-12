import { SquareDashedMousePointer } from "lucide-react";
import React from "react";

interface DiagramButtonProps extends React.ComponentPropsWithoutRef<"button"> {}

const DiagramButton = React.forwardRef<HTMLButtonElement, DiagramButtonProps>(
  (props, ref) => {
    return (
      <>
        <button
          ref={ref}
          {...props}
          className="h-full w-12 bg-card hover:bg-muted border-l border-border/40 rounded-md transition-colors duration-200 group relative"
          aria-label="Open Analytics Diagram"
        >
          {/* Content Container */}
          <div className="relative h-full flex flex-col items-center justify-start gap-4 px-2">
            {/* Diagram Icon */}
            <div className="flex flex-col items-center p-1.5 mt-2 gap-2 h-[120px] bg-muted rounded-full group-hover:bg-white/10 transition-colors">
              <SquareDashedMousePointer
                className="w-5 h-5 mt-2 text-white/80 group-hover:text-white transition-colors"
                strokeWidth={2}
              />
              {/* Vertical Text */}
              <div className="flex-1 flex items-center justify-center">
                <div
                  style={{
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                  }}
                >
                  <span className="whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    Diagram
                  </span>
                </div>
              </div>
            </div>
          </div>
        </button>
      </>
    );
  },
);

DiagramButton.displayName = "DiagramButton";

export default DiagramButton;
