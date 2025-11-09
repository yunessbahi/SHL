"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { authFetch } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker24h } from "@/components/ui/date-time-picker-24h";
import {
  CheckCircle,
  XCircle,
  Globe,
  Smartphone,
  Monitor,
  Clock,
  ExternalLink,
  Copy,
  RefreshCw,
} from "lucide-react";
import TraceViewer from "@/app/components/TraceViewer";
import { useCountries } from "@/lib/hooks/useCountries";

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
  const [activeTab, setActiveTab] = useState("summary");

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner className="size-8 mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
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
            <Label htmlFor="realtime-mode">Realtime mode</Label>
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
                <Spinner className="h-4 w-4 mr-2" />
                Evaluating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
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
        <Card>
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
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-8 w-8" />
                <span className="ml-2">Evaluating rules...</span>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4">
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <Button
                    variant={activeTab === "summary" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setActiveTab("summary")}
                    className="flex-1"
                  >
                    Summary
                  </Button>
                  <Button
                    variant={activeTab === "url" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setActiveTab("url")}
                    className="flex-1"
                  >
                    Final URL
                  </Button>
                  <Button
                    variant={activeTab === "trace" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setActiveTab("trace")}
                    className="flex-1"
                  >
                    Trace
                  </Button>
                </div>

                {/* Tab Content */}
                {activeTab === "summary" && (
                  <div className="space-y-4">
                    {result.chosen ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">
                            Target Selected
                          </h3>
                          <Badge
                            variant="primary"
                            className="bg-green-100 text-green-800"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Match Found
                          </Badge>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-green-900">
                                Target ID: {result.chosen.id}
                              </p>
                              <p className="text-sm text-green-700 mt-1">
                                Weight: {result.chosen.weight || 1}
                              </p>
                              {result.chosen.target_url && (
                                <p className="text-sm text-green-700 mt-1">
                                  URL: {result.chosen.target_url}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          <p>
                            <strong>Context Used:</strong>
                          </p>
                          <ul className="mt-2 space-y-1">
                            {context.country && (
                              <li>Country: {context.country}</li>
                            )}
                            {context.is_mobile !== undefined && (
                              <li>
                                Device:{" "}
                                {context.is_mobile ? "Mobile" : "Desktop"}{" "}
                                (is_mobile: {context.is_mobile})
                              </li>
                            )}
                            {context.referer && (
                              <li>Referer: {context.referer}</li>
                            )}
                            {context.custom_datetime && (
                              <li>
                                Custom DateTime: {context.custom_datetime}
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
                  </div>
                )}

                {activeTab === "url" && (
                  <div className="space-y-4">
                    {result.final_url ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Final URL</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(result.final_url!)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                        </div>

                        <div className="bg-gray-50 border rounded-lg p-4">
                          <code className="text-sm break-all">
                            {result.final_url}
                          </code>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
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
                  </div>
                )}

                {activeTab === "trace" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Evaluation Trace</h3>
                    <TraceViewer trace={result.trace} />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
