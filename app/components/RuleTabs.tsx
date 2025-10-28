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
}: RuleTabsProps) {
  const [internalTab, setInternalTab] = useState("audience");
  const tab = activeTab ?? internalTab;
  const changeTab = onTabChange ?? setInternalTab;

  const jsonStr = useMemo(() => JSON.stringify(rules || {}, null, 2), [rules]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Start (ISO)</label>
              <div className="flex gap-1">
                {inheritedStartDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setRules({
                        ...rules,
                        time_window: {
                          ...(rules?.time_window || {}),
                          start: inheritedStartDate,
                        },
                      })
                    }
                    className="h-6 px-2 text-xs"
                    title="Restore to inherited date"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setRules({
                      ...rules,
                      time_window: { ...(rules?.time_window || {}), start: "" },
                    })
                  }
                  className="h-6 px-2 text-xs"
                  title="Clear date"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <CalendarWithTimeInput
              value={convertStringToDate(
                rules?.time_window?.start || inheritedStartDate || "",
              )}
              onChange={(date) =>
                setRules({
                  ...rules,
                  time_window: {
                    ...(rules?.time_window || {}),
                    start: convertDateToString(date),
                  },
                })
              }
            />
            {inheritedStartDate && (
              <p className="text-xs text-blue-600 mt-1">
                {rules?.time_window?.start === inheritedStartDate
                  ? "Inherited from behavior settings"
                  : `Behavior starts: ${new Date(inheritedStartDate).toLocaleString()}`}
              </p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">End (ISO)</label>
              <div className="flex gap-1">
                {inheritedEndDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setRules({
                        ...rules,
                        time_window: {
                          ...(rules?.time_window || {}),
                          end: inheritedEndDate,
                        },
                      })
                    }
                    className="h-6 px-2 text-xs"
                    title="Restore to inherited date"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setRules({
                      ...rules,
                      time_window: { ...(rules?.time_window || {}), end: "" },
                    })
                  }
                  className="h-6 px-2 text-xs"
                  title="Clear date"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <CalendarWithTimeInput
              value={convertStringToDate(
                rules?.time_window?.end || inheritedEndDate || "",
              )}
              onChange={(date) =>
                setRules({
                  ...rules,
                  time_window: {
                    ...(rules?.time_window || {}),
                    end: convertDateToString(date),
                  },
                })
              }
            />
            {inheritedEndDate && (
              <p className="text-xs text-blue-600 mt-1">
                {rules?.time_window?.end === inheritedEndDate
                  ? "Inherited from behavior settings"
                  : `Behavior ends: ${new Date(inheritedEndDate).toLocaleString()}`}
              </p>
            )}
          </div>
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
