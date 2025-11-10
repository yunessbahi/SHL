import * as React from "react";
import { Progress } from "@/components/ui/base-progress";

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
      if (expiryDate && start && createdAt) {
        const startTime = new Date(start).getTime();
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
      return "Expires soon";
    }
  };

  // Get progress color based on status
  const getProgressColor = (): string => {
    if (timeRemaining.isExpired) {
      return "bg-red-500";
    }

    if (timeRemaining.isFuture) {
      return "bg-blue-500";
    }

    // Active link - color based on time remaining
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

      <Progress value={progressValue} className={`h-2 ${getProgressColor()}`} />

      <div className="text-xs text-muted-foreground">{statusMessage}</div>
    </div>
  );
}
