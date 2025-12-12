"use client";

import { useState, useCallback, useMemo } from "react";
import { format, addDays } from "date-fns";

export interface DatetimeState {
  startDate: string;
  endDate: string;
  expiresAt: string;
  timeWindowOverride: {
    start?: string;
    end?: string;
  };
}

export interface CampaignInfo {
  campaignStartDate?: string;
  campaignEndDate?: string;
  campaignTtlDays?: number;
  campaignLifecycle?: number;
  hasCampaign: boolean;
  isAlwaysOn: boolean;
}

export interface DatetimeActions {
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setExpiresAt: (date: string) => void;
  setTimeWindowOverride: (override: { start?: string; end?: string }) => void;
  resetToCampaignDates: () => void;
  clearTimeWindowOverride: () => void;
  calculateExpiryFromCampaign: () => void;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const convertStringToDate = (dateString: string): Date | undefined => {
  return dateString ? new Date(dateString) : undefined;
};

const convertDateToString = (date: Date | undefined): string => {
  return date ? date.toISOString() : "";
};

const isValidDateRange = (start: string, end: string): boolean => {
  if (!start || !end) return true; // Optional dates
  const startDate = new Date(start);
  const endDate = new Date(end);
  return startDate < endDate;
};

/**
 * Simplified hook for managing datetime form state with campaign integration
 * Removed auto-calculation effects that were causing infinite re-renders
 */
export function useDatetimeForm(
  initialState: Partial<DatetimeState> = {},
  campaignInfo?: CampaignInfo,
): [DatetimeState, DatetimeActions, ValidationResult] {
  const [state, setState] = useState<DatetimeState>({
    startDate: initialState.startDate || "",
    endDate: initialState.endDate || "",
    expiresAt: initialState.expiresAt || "",
    timeWindowOverride: initialState.timeWindowOverride || {},
  });

  const [warnings, setWarnings] = useState<string[]>([]);

  // Actions - these are explicit and user-triggered only
  const setStartDate = useCallback((date: string) => {
    setState((prev) => ({ ...prev, startDate: date }));
    // Clear validation warnings when user provides input
    setWarnings((prev) => prev.filter((w) => !w.includes("start date")));
  }, []);

  const setEndDate = useCallback((date: string) => {
    setState((prev) => ({ ...prev, endDate: date }));
    // Clear validation warnings when user provides input
    setWarnings((prev) => prev.filter((w) => !w.includes("end date")));
  }, []);

  const setExpiresAt = useCallback((date: string) => {
    setState((prev) => ({ ...prev, expiresAt: date }));
  }, []);

  const setTimeWindowOverride = useCallback(
    (override: { start?: string; end?: string }) => {
      setState((prev) => ({
        ...prev,
        timeWindowOverride: {
          ...prev.timeWindowOverride,
          ...override,
        },
      }));
    },
    [],
  );

  const resetToCampaignDates = useCallback(() => {
    if (!campaignInfo?.hasCampaign) return;

    setState((prev) => ({
      ...prev,
      startDate: campaignInfo.campaignStartDate || "",
      endDate:
        campaignInfo.campaignLifecycle === 1
          ? ""
          : campaignInfo.campaignEndDate || "",
      timeWindowOverride: {
        start: campaignInfo.campaignStartDate,
        end:
          campaignInfo.campaignLifecycle === 1
            ? undefined
            : campaignInfo.campaignEndDate,
      },
    }));
  }, [campaignInfo]);

  const clearTimeWindowOverride = useCallback(() => {
    setState((prev) => ({
      ...prev,
      timeWindowOverride: {},
    }));
  }, []);

  // Explicit action for calculating expiry - not automatic
  const calculateExpiryFromCampaign = useCallback(() => {
    if (!campaignInfo?.hasCampaign || !campaignInfo.campaignTtlDays) return;

    const { campaignLifecycle } = campaignInfo;

    if (campaignLifecycle === 1 && state.startDate) {
      // Always-on: calculate from start date
      const start = new Date(state.startDate);
      const expires = addDays(start, campaignInfo.campaignTtlDays);
      setState((prev) => ({
        ...prev,
        expiresAt: convertDateToString(expires),
      }));
    } else if (campaignLifecycle === 2 && state.endDate) {
      // One-off: use end date
      setState((prev) => ({ ...prev, expiresAt: state.endDate }));
    }
  }, [campaignInfo, state.startDate, state.endDate]);

  // Validation - memoized to prevent re-creation on every render
  const validation: ValidationResult = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Date range validation
    if (
      state.startDate &&
      state.endDate &&
      !isValidDateRange(state.startDate, state.endDate)
    ) {
      errors.push("Start date must be before end date");
    }

    // Campaign integration validation
    if (campaignInfo?.hasCampaign) {
      const { campaignStartDate, campaignEndDate, campaignLifecycle } =
        campaignInfo;

      if (campaignStartDate && state.startDate) {
        const linkStart = new Date(state.startDate);
        const campStart = new Date(campaignStartDate);
        if (linkStart < campStart) {
          warnings.push("Link start date is before campaign start date");
        }
      }

      if (campaignLifecycle !== 1 && campaignEndDate && state.endDate) {
        const linkEnd = new Date(state.endDate);
        const campEnd = new Date(campaignEndDate);
        if (linkEnd > campEnd) {
          warnings.push("Link end date extends beyond campaign end date");
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [state, campaignInfo]);

  return [
    state,
    {
      setStartDate,
      setEndDate,
      setExpiresAt,
      setTimeWindowOverride,
      resetToCampaignDates,
      clearTimeWindowOverride,
      calculateExpiryFromCampaign,
    },
    validation,
  ];
}

/**
 * Hook for managing target-specific datetime rules
 */
export function useTargetDatetime(
  initialRules: Record<string, any> = {},
  linkDatetime: DatetimeState,
): [Record<string, any>, (rules: Record<string, any>) => void] {
  const [rules, setRules] = useState<Record<string, any>>(() => {
    // Extract time_window_override from rules, keeping only overrides
    const { time_window_override, ...otherRules } = initialRules;
    return otherRules;
  });

  const updateRules = useCallback((newRules: Record<string, any>) => {
    setRules(newRules);
  }, []);

  return [rules, updateRules];
}

/**
 * Utility function to format datetime for API calls
 */
export function formatDatetimeForApi(datetimeStr: string): string | null {
  if (!datetimeStr) return null;
  const date = new Date(datetimeStr);
  return date.toISOString().replace("+00:00", "Z");
}

/**
 * Utility function to format datetime for UI display
 */
export function formatDatetimeForUI(datetimeStr: string | null): string | null {
  if (!datetimeStr) return null;
  const date = new Date(datetimeStr);
  return format(date, "yyyy-MM-dd HH:mm:ss");
}

/**
 * Check if a datetime is in the past
 */
export function isDateTimePast(datetimeStr: string): boolean {
  if (!datetimeStr) return false;
  return new Date(datetimeStr) < new Date();
}
