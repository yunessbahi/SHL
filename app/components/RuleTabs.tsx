"use client";
import { MultiSelect } from "@/components/multi-select";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox-default";
import { useCountries } from "@/lib/hooks/useCountries";
import { useMemo, useState } from "react";
import JsonEditor from "../components/JsonEditor";

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
  campaignStartDate?: string;
  campaignEndDate?: string;
  onRestoreInheritedTimeWindow?: () => void;
};

export default function RuleTabs({
  rules,
  setRules,
  activeTab,
  onTabChange,
  inheritedTimeWindow,
}: RuleTabsProps) {
  const [internalTab, setInternalTab] = useState("audience");
  const tab = activeTab ?? internalTab;
  const changeTab = onTabChange ?? setInternalTab;

  // Load countries dynamically from the database
  const {
    countryOptions,
    loading: countriesLoading,
    error: countriesError,
    isUsingFallback,
    retryCount,
    lastSuccessfulLoad,
    forceRefresh,
  } = useCountries();

  // Reactive JSON that shows current rules state with time_window_override and utm_overrides
  const jsonStr = useMemo(() => {
    const displayRules = { ...rules };

    // Add time_window_override to display if inheritedTimeWindow has overrides
    if (
      inheritedTimeWindow &&
      (inheritedTimeWindow.start || inheritedTimeWindow.end)
    ) {
      displayRules.time_window_override = inheritedTimeWindow;
    }

    // Ensure utm_overrides is displayed even if empty
    if (!displayRules.utm_overrides) {
      displayRules.utm_overrides = {};
    }

    return JSON.stringify(displayRules, null, 2);
  }, [rules, inheritedTimeWindow]);

  // For RuleTabs, we don't auto-update time_window anymore since it's managed centrally
  // The time_window in rules should only contain overrides, not inherited values

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        {["audience", "utm", "json"].map((t) => (
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
          <div>
            <label className="block text-sm mb-1">Country allow</label>
            <MultiSelect
              placeholder="Any"
              variant={"default"}
              //className="w-full pl-3 text-left font-normal bg-input/20 border border-border hover:bg-input/40 shadow-none"
              options={countryOptions}
              defaultValue={rules?.country_allow || []}
              onValueChange={(vals) =>
                setRules({ ...rules, country_allow: vals })
              }
              disabled={countriesLoading}
            />

            {/* Enhanced status indicators */}
            {countriesLoading && (
              <div className="flex items-center gap-2 mt-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div>
                <p className="text-xs text-muted-foreground">
                  Loading countries from database...
                </p>
              </div>
            )}

            {isUsingFallback && !countriesLoading && (
              <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-amber-800 font-medium">
                      ⚠️ Using fallback countries
                    </p>
                    <p className="text-xs text-amber-700">
                      Limited to {countryOptions.length} countries due to API
                      connection issues
                    </p>
                    {lastSuccessfulLoad && (
                      <p className="text-xs text-amber-600 mt-1">
                        Last successful sync:{" "}
                        {lastSuccessfulLoad.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={forceRefresh}
                    className="text-xs h-6 px-2"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {countriesError && !isUsingFallback && (
              <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-red-800 font-medium">
                      ❌ Failed to load countries
                    </p>
                    <p className="text-xs text-red-700">{countriesError}</p>
                    {retryCount > 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        Retried {retryCount} time{retryCount !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={forceRefresh}
                    className="text-xs h-6 px-2"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {!countriesLoading &&
              !countriesError &&
              !isUsingFallback &&
              countryOptions.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Loaded {countryOptions.length} countries
                </p>
              )}
          </div>
          <div>
            <label className="block text-sm mb-1">Device allow</label>
            <Combobox
              options={[
                { value: "", label: "Any" },
                { value: "mobile", label: "Mobile" },
                { value: "desktop", label: "Desktop" },
              ]}
              value={(rules?.device_allow && rules.device_allow[0]) || ""}
              onValueChange={(value) =>
                setRules({
                  ...rules,
                  device_allow: value ? [value] : [],
                })
              }
              placeholder="Select device type"
              allowClear={false}
            />
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
              } catch {
                // Invalid JSON, ignore changes
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            Override specific UTM parameters from the selected template. This
            JSON will be merged with template defaults.
          </p>
        </div>
      )}

      {tab === "json" && (
        <JsonEditor
          value={jsonStr}
          onChange={(s) => {
            try {
              setRules(JSON.parse(s));
            } catch {
              // Invalid JSON, ignore changes
            }
          }}
        />
      )}
    </div>
  );
}
