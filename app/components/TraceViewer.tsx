"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CopyButton } from "@/components/ui/shadcn-io/copy-button";
import { CheckCircle, Copy, Eye, XCircle } from "lucide-react";

interface TraceViewerProps {
  trace: any;
}

export default function TraceViewer({ trace }: TraceViewerProps) {
  if (!trace || !trace.evaluated) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (passed: boolean) => {
    return passed ? (
      <Badge
        variant="primary"
        className="bg-green-500/5 border border-green-500 text-green-700 dark:text-green-400"
      >
        <CheckCircle className="h-3 w-3 mr-1" />
        PASS
      </Badge>
    ) : (
      <Badge
        variant="destructive"
        className="bg-red-500/5 border border-red-500 text-red-700 dark:text-red-500"
      >
        <XCircle className="h-3 w-3 mr-1" />
        FAIL
      </Badge>
    );
  };

  return (
    <div className="space-y-4 text-popover-foreground">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold leading-none tracking-tight flex items-center text-muted-foreground">
          <Eye className="h-5 w-5 mr-2" />
          Rule Evaluation Trace
        </h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="text-muted-foreground"
              size="sm"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Raw Data
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Raw Trace Data</DialogTitle>
              <DialogDescription>
                Complete evaluation trace in JSON format
              </DialogDescription>
            </DialogHeader>
            <pre className="text-xs whitespace-pre-wrap bg-muted text-popover-foreground p-4 rounded-lg border relative pt-8">
              <CopyButton
                size={"default"}
                variant={"muted"}
                content={JSON.stringify(trace, null, 2)}
                onCopy={() => console.log("Evaluation trace copied!")}
                className="absolute top-2 right-2"
              />
              {JSON.stringify(trace, null, 2)}
            </pre>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {trace.evaluated.map((target: any, index: number) => (
          <Card
            key={index}
            className={`transition-colors ${target.passed ? "bg-green-500/5 border border-green-500" : "bg-red-500/5 border border-red-500"}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex flex-inline items-center gap-1 text-popover-foreground">
                  Target
                  <span className="font-mono">
                    #{target.id || `Target ${index + 1}`}
                  </span>
                </CardTitle>
                {getStatusBadge(target.passed)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {/* Pass/Fail Summary */}
              <div className="flex items-center space-x-2">
                {getStatusIcon(target.passed)}
                <span
                  className={`font-medium text-sm ${target.passed ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-500"}`}
                >
                  {target.passed
                    ? "All rules passed"
                    : "Rule evaluation failed"}
                </span>
              </div>

              {/* Failed Rules */}
              {target.failed && target.failed.length > 0 && (
                <div className="space-y-2">
                  <p className="text-muted-foreground">Failed Evaluations:</p>
                  <div className="space-y-1 text-[11px]">
                    {target.failed.map((rule: string, ruleIndex: number) => (
                      <div
                        key={ruleIndex}
                        className="flex items-center space-x-2 text-red-700 dark:text-red-400"
                      >
                        <XCircle className="h-3 w-3" />
                        <code className="bg-red-500/20 px-2 py-1 rounded">
                          {rule.replace("_eval_", "").replace("_", " ")}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Rule Analysis */}
              {target.passed && (
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    Successful Evaluations:
                  </p>
                  <div className="space-y-1 text-[11px]">
                    {["country", "device", "time", "expires"].map(
                      (ruleType) => (
                        <div
                          key={ruleType}
                          className="flex items-center space-x-2 text-green-700 dark:text-green-400"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <code className="bg-green-500/20 px-2 py-1 rounded">
                            {ruleType.replace("_", " ")}
                          </code>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Context Information */}
              <div className="pt-2 text-[12px] border-t border-muted-foreground/10">
                <p className="text-muted-foreground mb-1">
                  Evaluation Context:
                </p>
                <code className="bg-secondary text-popover-foreground px-2 py-1 rounded">
                  ID: {target.id} • Status:{" "}
                  {target.passed ? "Selected" : "Rejected"}
                </code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Summary */}
      <Card className="border-neutral-100/50 bg-neutral-50 dark:border-neutral-50/20 dark:bg-neutral-700/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1 text-xs">
              <p className="flex flex-inline items-center gap-1 font-medium text-popover-foreground">
                Total Targets Evaluated
                <Badge size={"xs"} className="rounded-full h-4 w-4 font-mono">
                  {trace.evaluated.length}
                </Badge>
              </p>
              <p className="flex flex-inline items-center text-center gap-1 font-medium text-green-600 dark:text-green-400">
                Targets Passed
                <Badge
                  size={"xs"}
                  className="rounded-full bg-green-500/10 border-green-600/20 font-mono text-green-600 dark:text-green-400"
                >
                  {trace.evaluated.filter((t: any) => t.passed).length}
                </Badge>
              </p>
            </div>
            <Badge
              variant="outline"
              className="bg-neutral-100 dark:bg-neutral-100/10 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-400"
            >
              <Eye className="h-3 w-3 mr-1" />
              Trace Complete
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
