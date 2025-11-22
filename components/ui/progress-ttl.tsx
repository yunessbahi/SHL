import * as React from "react";
import { Progress } from "@/components/ui/base-progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  InfoIcon,
} from "lucide-react";
import { Separator } from "@/app/components/ui/separator";

interface ProgressTTLProps {
  startDate?: string | null;
  endDate?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  showTitle?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  total: number; // in milliseconds
  isExpired: boolean;
  isFuture: boolean;
}

// Helper function to check if expiry date is approximately 30 days from creation (TTL expiry)
const isTTLExpiry = (endDate: string, createdAt: string): boolean => {
  const created = new Date(createdAt).getTime();
  const expiry = new Date(endDate).getTime();
  const diffDays = (expiry - created) / (1000 * 60 * 60 * 24);
  // Consider it TTL expiry if it's between 29-31 days
  return diffDays >= 29 && diffDays <= 31;
};

export default function ProgressTTL({
  startDate,
  endDate,
  expiresAt,
  createdAt,
  className = "",
  size = "default",
  showTitle = true,
}: ProgressTTLProps) {
  const [timeRemaining, setTimeRemaining] = React.useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    total: 0,
    isExpired: false,
    isFuture: false,
  });

  // Calculate time remaining function
  const calculateTimeRemaining = React.useCallback(
    (
      start?: string | null,
      end?: string | null,
      expires?: string | null,
    ): TimeRemaining => {
      const now = new Date();

      // Handle future start date
      if (start && new Date(start) > now) {
        const total = new Date(start).getTime() - now.getTime();
        const days = Math.floor(total / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));

        return {
          days,
          hours,
          minutes,
          total,
          isExpired: false,
          isFuture: true,
        };
      }

      // Handle expired link
      const expiryDate = expires || end;
      if (expiryDate && new Date(expiryDate) <= now) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          total: 0,
          isExpired: true,
          isFuture: false,
        };
      }

      // Handle active link with time remaining
      if (expiryDate) {
        // Use start date if available, otherwise use createdAt as start
        const effectiveStart = start || createdAt;
        if (effectiveStart) {
          const startTime = new Date(effectiveStart).getTime();
          const expiryTime = new Date(expiryDate).getTime();
          const nowTime = now.getTime();

          // Calculate total time window and elapsed time
          const totalWindow = expiryTime - startTime;
          const elapsed = Math.max(0, nowTime - startTime);

          const remaining = Math.max(0, expiryTime - nowTime);
          const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          );
          const minutes = Math.floor(
            (remaining % (1000 * 60 * 60)) / (1000 * 60),
          );

          return {
            days,
            hours,
            minutes,
            total: remaining,
            isExpired: remaining <= 0,
            isFuture: false,
          };
        }
      }

      return {
        days: 0,
        hours: 0,
        minutes: 0,
        total: 0,
        isExpired: false,
        isFuture: false,
      };
    },
    [createdAt],
  );

  // Update time remaining calculation
  React.useEffect(() => {
    const updateTimeRemaining = () => {
      const calculated = calculateTimeRemaining(startDate, endDate, expiresAt);
      setTimeRemaining(calculated);
    };

    // Calculate immediately
    updateTimeRemaining();

    // Update every minute to avoid too frequent updates
    const interval = setInterval(updateTimeRemaining, 60000);

    return () => clearInterval(interval);
  }, [startDate, endDate, expiresAt, calculateTimeRemaining]);

  // Calculate progress percentage based on time remaining
  const getProgressValue = (): number => {
    if (timeRemaining.isExpired) return 100;
    if (timeRemaining.isFuture) return 0;

    // For active links, calculate progress based on time elapsed
    if (expiresAt && startDate && createdAt) {
      const startTime = new Date(startDate).getTime();
      const expiryTime = new Date(expiresAt).getTime();
      const nowTime = new Date().getTime();

      const totalWindow = expiryTime - startTime;
      const elapsed = Math.max(0, nowTime - startTime);

      return Math.min(Math.max((elapsed / totalWindow) * 100, 0), 100);
    }

    return 0;
  };

  // Get status message based on time remaining
  const getStatusMessage = (): string => {
    // First check if link has no explicit expiry date (never expires)
    // If endDate is null, or if endDate is approximately 30 days from createdAt (TTL expiry)
    if (!endDate || (endDate && createdAt && isTTLExpiry(endDate, createdAt))) {
      return "Never expires";
    }

    if (timeRemaining.isExpired) {
      return "Link expired";
    }

    if (timeRemaining.isFuture) {
      if (timeRemaining.days > 0) {
        return `Starts in ${timeRemaining.days}d ${timeRemaining.hours}h`;
      } else if (timeRemaining.hours > 0) {
        return `Starts in ${timeRemaining.hours}h ${timeRemaining.minutes}m`;
      } else {
        return `Starts in ${timeRemaining.minutes}m`;
      }
    }

    // Active link with time remaining
    if (timeRemaining.days > 0) {
      return `${timeRemaining.days}d ${timeRemaining.hours}h remaining`;
    } else if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m remaining`;
    } else if (timeRemaining.minutes > 0) {
      return `${timeRemaining.minutes}m remaining`;
    } else {
      // No time remaining - this should only happen for links with expiry dates
      // For links with no expiry date, the check above should have caught it
      return "No Expiry date";
    }
  };

  // Get progress color based on remaining time (matches tooltip guide)
  const getProgressColor = (): string => {
    if (timeRemaining.isExpired) {
      return "bg-red-500";
    }

    if (timeRemaining.isFuture) {
      return "bg-blue-500";
    }

    // Active link - color based on remaining time (matches tooltip guide)
    if (timeRemaining.days > 7) {
      return "bg-green-500/90";
    } else if (timeRemaining.days > 1) {
      return "bg-yellow-500/90";
    } else if (timeRemaining.hours > 0) {
      return "bg-orange-500/90";
    } else {
      return "bg-red-500";
    }
  };

  const progressValue = getProgressValue();
  const statusMessage = getStatusMessage();

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {showTitle && (
        <div className="flex justify-between">
          <span>Time to Expiry</span>
          <span className="text-muted-foreground">
            {timeRemaining.isExpired
              ? "Expired"
              : `${Math.round(progressValue)}%`}
          </span>
        </div>
      )}

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full transition-all duration-300 ease-in-out ${getProgressColor()}`}
          style={{ width: `${progressValue}%` }}
        />
      </div>

      <div className="flex items-center justify-between isolate relative ">
        <div className="text-xs text-muted-foreground">{statusMessage}</div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-xs p-1 cursor-pointer">
                <InfoIcon className="size-4" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-2">
                <div className="flex flex-inline gap-2 font-medium mb-2">
                  <InfoIcon className="size-4" />
                  Color Code Guide
                </div>
                <Separator orientation={"horizontal"} className="opacity-10" />
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="flex flex-inline items-center">
                    {<ChevronRight className="w-3 h-3" />}7 days remaining
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>1-7 days remaining</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="flex flex-inline items-center">
                    {<ChevronLeft className="w-3 h-3" />}1 day remaining
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Link Expired</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-secondary/60 dark:bg-secondary/30 rounded-full"></div>
                  <span>Never Expires</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
