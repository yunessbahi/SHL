"use client";
import React, { useMemo, useState } from "react";
import JsonEditor from "../components/JsonEditor";
import MultiSelect from "../components/MultiSelect";
import DateTimePicker from "../components/DateTimePicker";

const COUNTRY_OPTIONS = [
  { label: "US", value: "US" },
  { label: "FR", value: "FR" },
  { label: "GB", value: "GB" },
  { label: "DE", value: "DE" },
  { label: "CA", value: "CA" },
];

type RuleTabsProps = {
  rules: any;
  setRules: (r: any) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
};

export default function RuleTabs({
  rules,
  setRules,
  activeTab,
  onTabChange,
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
            onClick={() => changeTab(t)}
            className={`px-3 py-2 text-sm ${tab === t ? "border-b-2 border-indigo-600 font-semibold" : "text-gray-600"}`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "audience" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <MultiSelect
              label="Country allow"
              options={COUNTRY_OPTIONS}
              values={rules?.country_allow || []}
              onChange={(vals) => setRules({ ...rules, country_allow: vals })}
            />
          </div>
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
          <DateTimePicker
            label="Start (ISO)"
            value={rules?.time_window?.start || ""}
            onChange={(v) =>
              setRules({
                ...rules,
                time_window: { ...(rules?.time_window || {}), start: v },
              })
            }
          />
          <DateTimePicker
            label="End (ISO)"
            value={rules?.time_window?.end || ""}
            onChange={(v) =>
              setRules({
                ...rules,
                time_window: { ...(rules?.time_window || {}), end: v },
              })
            }
          />
          <div className="md:col-span-2">
            <DateTimePicker
              label="Expires at (ISO)"
              value={rules?.expires_at || ""}
              onChange={(v) => setRules({ ...rules, expires_at: v })}
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
