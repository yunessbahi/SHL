/**
 * Status Component
 *
 * A flexible badge component for displaying status indicators with colored dots and labels.
 * Supports multiple variants with predefined styles and custom labels.
 *
 * @example
 * // Basic usage with custom labels
 * import { Status } from '@/app/components/ui/badges-var1.tsx'
 *
 * <Status variant='danger' label='Expired' />
 * <Status variant='active' label='Live Now' />
 * <Status variant='warn' label='Pending Review' />
 * <Status variant='default' label='Draft' />
 *
 * @example
 * // With custom className for additional styling
 * <Status variant='danger' label='Critical' className='text-xs font-bold' />
 *
 * @example
 * // Using preset components with default labels
 * import { BadgeDanger, BadgeActive, BadgeWarn } from '@/components/ui/status'
 *
 * <BadgeDanger /> // Displays "Expired"
 * <BadgeActive /> // Displays "Completed"
 * <BadgeWarn /> // Displays "In Progress"
 *
 * @example
 * // Using preset components with custom labels
 * <BadgeDanger label='Failed' />
 * <BadgeActive label='Success' />
 * <BadgeWarn label='Loading' />
 *
 * @component
 * @param {StatusProps} props - The component props
 * @param {'danger' | 'active' | 'warn' | 'default'} [props.variant='default'] - The visual style variant
 * @param {string} props.label - The text to display in the badge
 * @param {string} [props.className] - Optional additional CSS classes
 *
 * Variants:
 * - `danger`: Red color scheme with dot indicator (for errors, expired, failed states)
 * - `active`: Green color scheme with dot indicator (for success, completed, active states)
 * - `warn`: Amber color scheme with dot indicator (for warnings, pending, in-progress states)
 * - `default`: Secondary badge style without dot indicator (for neutral states)
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusVariant = "danger" | "active" | "warn" | "default";

interface StatusProps {
  variant?: StatusVariant;
  label: string;
  className?: string;
}

const statusStyles = {
  danger: {
    badge:
      "bg-red-500/10 [a&]:hover:bg-destructive/5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-red-500",
    dot: "bg-red-500",
  },
  active: {
    badge:
      "bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5",
    dot: "bg-green-600 dark:bg-green-400",
  },
  warn: {
    badge:
      "bg-amber-600/10 text-amber-600 focus-visible:ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:focus-visible:ring-amber-400/40 [a&]:hover:bg-amber-600/5 dark:[a&]:hover:bg-amber-400/5",
    dot: "bg-amber-600 dark:bg-amber-400",
  },
  default: {
    badge: "",
    dot: "",
  },
};

export const Status = ({
  variant = "default",
  label,
  className,
}: StatusProps) => {
  const styles = statusStyles[variant];

  if (variant === "default") {
    return (
      <Badge variant="secondary" className={className}>
        {label}
      </Badge>
    );
  }

  return (
    <Badge
      className={cn(
        "rounded-full border-none focus-visible:outline-none",
        styles.badge,
        className,
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", styles.dot)}
        aria-hidden="true"
      />
      {label}
    </Badge>
  );
};

/**
 * BadgeDanger - Preset component for danger/error states
 * @param {Object} props
 * @param {string} [props.label='Expired'] - Custom label (defaults to "Expired")
 */
export const BadgeDanger = ({ label = "Expired" }: { label?: string }) => (
  <Status variant="danger" label={label} />
);

/**
 * BadgeActive - Preset component for active/success states
 * @param {Object} props
 * @param {string} [props.label='Completed'] - Custom label (defaults to "Completed")
 */
export const BadgeActive = ({ label = "Completed" }: { label?: string }) => (
  <Status variant="active" label={label} />
);

/**
 * BadgeWarn - Preset component for warning/pending states
 * @param {Object} props
 * @param {string} [props.label='In Progress'] - Custom label (defaults to "In Progress")
 */
export const BadgeWarn = ({ label = "In Progress" }: { label?: string }) => (
  <Status variant="warn" label={label} />
);

/**
 * BadgeDefault - Preset component for neutral/default states
 * @param {Object} props
 * @param {string} [props.label='Secondary'] - Custom label (defaults to "Secondary")
 */
export const BadgeDefault = ({ label = "Secondary" }: { label?: string }) => (
  <Status variant="default" label={label} />
);
