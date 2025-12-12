"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { authFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

import TraceViewer from "@/app/components/TraceViewer";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker24h } from "@/components/ui/date-time-picker-24h";
import { CopyButton } from "@/components/ui/shadcn-io/copy-button";
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/ui/shadcn-io/tabs";
import { useCountries } from "@/lib/hooks/useCountries";
import {
  CheckCircle,
  Clock,
  ExternalLink,
  Globe,
  Monitor,
  RefreshCw,
  Smartphone,
  XCircle,
} from "lucide-react";

interface PreviewPageProps {
  user: any;
  id: string;
}

interface VisitorContext {
  country: string;
  device_type: string;
  is_mobile: boolean;
  referer: string;
  ip: string;
  ua: string;
  custom_datetime?: string;
}

interface PreviewResult {
  chosen: any;
  final_url?: string;
  trace: any;
}

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

export default function PreviewPage({ user, id }: PreviewPageProps) {
  const linkId = Number(id);
  const router = useRouter();
  const supabase = createClient();

  // Country data
  const { countryOptions, loading: countriesLoading } = useCountries();

  // State management
  const [context, setContext] = useState<VisitorContext>({
    country: "",
    device_type: "any",
    is_mobile: false,
    referer: "",
    ip: "",
    ua: "",
  });

  const [result, setResult] = useState<PreviewResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [realtimeMode, setRealtimeMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Debounced realtime preview
  const debouncedPreview = useCallback(
    debounce(async () => {
      if (realtimeMode) {
        await runPreview();
      }
    }, 500),
    [realtimeMode, context],
  );

  useEffect(() => {
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    if (linkId) {
      if (realtimeMode) {
        debouncedPreview();
      }
    }
  }, [context, realtimeMode, linkId, debouncedPreview]);

  const runPreview = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload: any = { link_id: linkId };

      // Include optional custom datetime for testing
      if (context.custom_datetime) {
        payload.custom_datetime = context.custom_datetime;
      }

      // Include basic context
      Object.keys(context).forEach((key) => {
        if (context[key as keyof VisitorContext] && key !== "custom_datetime") {
          payload[key] = context[key as keyof VisitorContext];
        }
      });

      const res = await authFetch("/api/rules/preview", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setLoading(false);

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        const errorText = await res.text();
        setError(`Failed to evaluate rules: ${errorText}`);
      }
    } catch (err) {
      setLoading(false);
      setError(
        `Network error: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "desktop":
        return <Monitor className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getCountryFlag = (countryCode: string) => {
    if (!countryCode) return "🌍";
    return countryCode
      .toUpperCase()
      .split("")
      .map((char) => String.fromCodePoint(0x1f1a5 + char.charCodeAt(0)))
      .join("");
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foureground">
        <Spinner className="size-4" />
        <span className="ml-2 text-sm">Loading</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Link Rules Preview
          </h1>
          <p className="text-muted-foreground mt-1">
            Link #{linkId} - Test rule evaluation with different visitor
            contexts
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="realtime-mode leading-none tracking-tight">
              Realtime mode
            </Label>
            <Checkbox
              id="realtime-mode"
              checked={realtimeMode}
              onCheckedChange={(checked) => setRealtimeMode(checked === true)}
            />
          </div>
          <Button
            onClick={runPreview}
            disabled={loading}
            className="bg-primary"
          >
            {loading ? (
              <>
                <Spinner className="size-4 mr-2" />
                Evaluating...
              </>
            ) : (
              <>
                <RefreshCw className="size-4 mr-2" />
                Run Preview
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Context Simulation Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Visitor Context Simulation
            </CardTitle>
            <CardDescription>
              Configure visitor characteristics to test your link rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={runPreview} className="space-y-4">
              {/* Country Selection */}
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={context.country}
                  onValueChange={(value) =>
                    setContext({ ...context, country: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          <span>{getCountryFlag(option.value)}</span>
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Device Type */}
              <div className="space-y-2">
                <Label htmlFor="device">Device Type</Label>
                <Select
                  value={context.device_type}
                  onValueChange={(value) =>
                    setContext({
                      ...context,
                      device_type: value,
                      is_mobile: value === "mobile",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4" />
                        <span>Any</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="mobile">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4" />
                        <span>Mobile</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="desktop">
                      <div className="flex items-center space-x-2">
                        <Monitor className="h-4 w-4" />
                        <span>Desktop</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Referer */}
              <div className="space-y-2">
                <Label htmlFor="referer">Referer URL</Label>
                <Input
                  id="referer"
                  value={context.referer}
                  onChange={(e) =>
                    setContext({ ...context, referer: e.target.value })
                  }
                  placeholder="https://example.com"
                />
              </div>

              {/* Advanced Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="advanced"
                    checked={showAdvanced}
                    onCheckedChange={(checked) =>
                      setShowAdvanced(checked === true)
                    }
                  />
                  <Label htmlFor="advanced">Advanced Settings</Label>
                </div>

                {showAdvanced && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="ip">IP Address (optional)</Label>
                      <Input
                        id="ip"
                        value={context.ip}
                        onChange={(e) =>
                          setContext({ ...context, ip: e.target.value })
                        }
                        placeholder="192.168.1.1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ua">User Agent (optional)</Label>
                      <Input
                        id="ua"
                        value={context.ua}
                        onChange={(e) =>
                          setContext({ ...context, ua: e.target.value })
                        }
                        placeholder="Mozilla/5.0..."
                      />
                    </div>

                    <div className="space-y-2">
                      <DateTimePicker24h
                        label="Custom DateTime (for testing time rules)"
                        value={context.custom_datetime}
                        onChange={(value) =>
                          setContext({ ...context, custom_datetime: value })
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card className="text-popover-foreground">
          <CardHeader>
            <CardTitle>Rule Evaluation Results</CardTitle>
            <CardDescription>
              See how your rules perform with the current context
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 border border-red-200 rounded-lg bg-red-50 text-red-800">
                <div className="flex items-center">
                  <XCircle className="h-4 w-4 mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <Spinner className="size-4" />
                <span className="ml-2 text-sm">Evaluating rules...</span>
              </div>
            )}

            {result && !loading && (
              <Tabs defaultValue="summary" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="url">Final URL</TabsTrigger>
                  <TabsTrigger value="trace">Trace</TabsTrigger>
                </TabsList>
                <TabsContents className="rounded-sm h-auto">
                  <TabsContent value="summary" className="space-y-4 h-auto">
                    {result.chosen ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold leading-none tracking-tight">
                            Target Selected
                          </h3>
                          <Badge
                            variant="primary"
                            className="bg-green-500/5 border border-green-500 text-green-700 dark:text-green-400"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Match Found
                          </Badge>
                        </div>

                        <div className="bg-green-500/5 border border-green-500 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-xs">
                              <p className="flex flex-inline items-center gap-1 font-medium text-green-700 dark:text-green-400">
                                <span className="opacity-70">Target ID:</span>
                                <span className="font-base font-mono">
                                  {result.chosen.id}
                                </span>
                              </p>
                              <p className="flex flex-inline items-center gap-1 font-medium text-green-700 dark:text-green-400 mt-1">
                                <span className="opacity-70">Weight:</span>
                                <span className="font-base font-mono">
                                  {result.chosen.weight || 1}
                                </span>
                              </p>
                              {result.chosen.target_url && (
                                <p className="flex flex-inline items-center gap-1 font-medium text-green-700 dark:text-green-400 mt-1">
                                  <span className="opacity-70">URL:</span>
                                  <span className="font-normal font-mono">
                                    {result.chosen.target_url}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          <p>
                            <strong>Context Used:</strong>
                          </p>
                          <ul className="mt-2 space-y-1">
                            {context.country && (
                              <li className="flex flex-inline gap-1 items-center justify-between">
                                <span className="font-medium opacity-70">
                                  Country:
                                </span>
                                <span className="font-mono uppercase">
                                  {context.country}
                                </span>
                              </li>
                            )}
                            {context.is_mobile !== undefined && (
                              <li className="flex flex-inline gap-1 items-center justify-between">
                                <span className="font-medium opacity-70">
                                  Device:
                                </span>
                                <span className="flex flex-inline items-center gap-1 font-mono">
                                  {context.is_mobile ? "Mobile" : "Desktop"}
                                  <code className="bg-secondary text-popover-foreground px-2 py-1 rounded">
                                    is_mobile:{" "}
                                    {context.is_mobile === true
                                      ? "True"
                                      : "False"}
                                  </code>
                                </span>
                              </li>
                            )}
                            {context.referer && (
                              <li className="flex flex-inline gap-1 items-center justify-between">
                                <span className="font-medium opacity-70">
                                  Referer:
                                </span>
                                <span className="font-mono">
                                  {context.referer}
                                </span>
                              </li>
                            )}
                            {context.custom_datetime && (
                              <li className="flex flex-inline gap-1 items-center justify-between">
                                <span className="font-medium opacity-70">
                                  Custom DateTime:
                                </span>
                                <span className="font-mono">
                                  {context.custom_datetime}
                                </span>
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                        <h3 className="text-lg font-semibold">
                          No Matching Target
                        </h3>
                        <p className="text-muted-foreground">
                          No targets matched the current visitor context
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="url" className="space-y-4 h-auto">
                    {result.final_url ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold leading-none tracking-tight">
                            Final URL
                          </h3>
                          <CopyButton
                            size={"default"}
                            variant={"muted"}
                            content={result.final_url!}
                            onCopy={() => console.log("Link copied!")}
                          />
                        </div>

                        <div className="bg-muted border rounded-lg p-4">
                          <code className="text-xs break-all">
                            {result.final_url}
                          </code>
                        </div>

                        <div className="text-xs text-muted-foreground flex space-x-2">
                          <Button
                            variant="outline"
                            size={"sm"}
                            onClick={() =>
                              window.open(result.final_url, "_blank")
                            }
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open URL
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No final URL available
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="trace" className="space-y-4 h-auto">
                    <h3 className="font-semibold leading-none tracking-tight">
                      Evaluation Trace
                    </h3>
                    <TraceViewer trace={result.trace} />
                  </TabsContent>
                </TabsContents>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
