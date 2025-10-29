"use client";
import React, { useMemo, useState } from "react";
import JsonEditor from "../components/JsonEditor";
//import MultiSelect from "../components/MultiSelect";
import { MultiSelect } from "@/components/multi-select";
import { CalendarWithTimeInput } from "@/components/ui/calendar-with-time-input";
import { Button } from "@/components/ui/button";
import { RotateCcw, X } from "lucide-react";

const COUNTRY_OPTIONS = [
  { label: "United States", value: "US" },
  { label: "France", value: "FR" },
  { label: "United Kingdom", value: "GB" },
  { label: "Germany", value: "DE" },
  { label: "Canada", value: "CA" },
];

type RuleTabsProps = {
  rules: any;
  setRules: (r: any) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  inheritedStartDate?: string;
  inheritedEndDate?: string;
  isAlwaysOn?: boolean;
  showTimeWindow?: boolean;
  inheritedTimeWindow?: { start?: string; end?: string };
  linkStartDate?: string;
  linkEndDate?: string;
};

const convertStringToDate = (dateString: string): Date | undefined => {
  return dateString ? new Date(dateString) : undefined;
};

const convertDateToString = (date: Date | undefined): string => {
  return date ? date.toISOString() : "";
};

export default function RuleTabs({
  rules,
  setRules,
  activeTab,
  onTabChange,
  inheritedStartDate,
  inheritedEndDate,
  isAlwaysOn = false,
  showTimeWindow = true,
  inheritedTimeWindow,
  linkStartDate,
  linkEndDate,
}: RuleTabsProps) {
  const [internalTab, setInternalTab] = useState("audience");
  const tab = activeTab ?? internalTab;
  const changeTab = onTabChange ?? setInternalTab;

  // Reactive JSON that reflects the dynamic datetime fields
  const jsonStr = useMemo(() => {
    const reactiveRules = { ...rules };

    // Always update time_window to reflect the current link-level dates
    if (linkStartDate || linkEndDate) {
      reactiveRules.time_window = {
        ...(reactiveRules.time_window || {}),
        start: linkStartDate || reactiveRules.time_window?.start,
        end: linkEndDate || reactiveRules.time_window?.end,
      };
    }

    return JSON.stringify(reactiveRules, null, 2);
  }, [rules, linkStartDate, linkEndDate]);

  // Auto-update time_window dates when inherited dates change
  React.useEffect(() => {
    if (inheritedTimeWindow) {
      // Inherit from link-level time window (centralized approach)
      setRules({
        ...rules,
        time_window: {
          ...(rules?.time_window || {}),
          start: inheritedTimeWindow.start || rules?.time_window?.start,
          end: inheritedTimeWindow.end || rules?.time_window?.end,
        },
      });
    } else if (isAlwaysOn) {
      // For always-on campaigns, set start to inheritedStartDate if not set or equal, and set end to null
      if (inheritedStartDate && (!rules?.time_window?.start || rules?.time_window?.start === inheritedStartDate)) {
        setRules({
          ...rules,
          time_window: {
            ...(rules?.time_window || {}),
            start: inheritedStartDate,
            end: null,
          },
        });
      } else {
        setRules({
          ...rules,
          time_window: {
            ...(rules?.time_window || {}),
            end: null,
          },
        });
      }
    } else {
      // For one-off campaigns, inherit dates
      if (inheritedStartDate && (!rules?.time_window?.start || rules?.time_window?.start === inheritedStartDate)) {
        setRules({
          ...rules,
          time_window: {
            ...(rules?.time_window || {}),
            start: inheritedStartDate,
          },
        });
      }
      if (inheritedEndDate && (!rules?.time_window?.end || rules?.time_window?.end === inheritedEndDate)) {
        setRules({
          ...rules,
          time_window: {
            ...(rules?.time_window || {}),
            end: inheritedEndDate,
          },
        });
      }
    }
  }, [inheritedStartDate, inheritedEndDate, inheritedTimeWindow, isAlwaysOn]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        {["audience", "behavior", "utm", "json"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => changeTab(t)}
            className={`px-3 py-2 text-sm ${
              tab === t
                ? "border-b-2 border-indigo-600 font-semibold"
                : "text-gray-600"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "audience" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MultiSelect
            placeholder="Country allow"
            options={COUNTRY_OPTIONS}
            defaultValue={rules?.country_allow || []}
            onValueChange={(vals) =>
              setRules({ ...rules, country_allow: vals })
            }
          />
          <div>
            <label className="block text-sm mb-1">Device allow</label>
            <select
              className="w-full border p-2 rounded"
              value={(rules?.device_allow && rules.device_allow[0]) || ""}
              onChange={(e) =>
                setRules({
                  ...rules,
                  device_allow: e.target.value ? [e.target.value] : [],
                })
              }
            >
              <option value="">Any</option>
              <option value="mobile">Mobile</option>
              <option value="desktop">Desktop</option>
            </select>
          </div>
        </div>
      )}

      {tab === "behavior" && (
        <div className="space-y-4">
          {!showTimeWindow && (
            <div className="text-sm text-muted-foreground">
              Time window settings have been moved to Behavior Settings for centralization.
            </div>
          )}
          {showTimeWindow && (
            <div className="text-sm text-muted-foreground">
              Time window controls have been deprecated. Use Behavior Settings for centralized time window management.
            </div>
          )}
        </div>
      )}

      {tab === "utm" && (
        <div className="grid grid-cols-1 gap-4">
          <label className="block text-sm">UTM Overrides (JSON)</label>
          <JsonEditor
            value={JSON.stringify(rules?.utm_overrides || {}, null, 2)}
            onChange={(s) => {
              try {
                setRules({ ...rules, utm_overrides: JSON.parse(s) });
              } catch {}
            }}
          />
        </div>
      )}

      {tab === "json" && (
        <JsonEditor
          value={jsonStr}
          onChange={(s) => {
            try {
              setRules(JSON.parse(s));
            } catch {}
          }}
        />
      )}
    </div>
  );
}
