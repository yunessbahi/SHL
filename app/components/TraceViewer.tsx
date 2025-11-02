"use client";
import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Copy, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        PASS
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        FAIL
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Eye className="h-5 w-5 mr-2" />
          Rule Evaluation Trace
        </h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
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
            <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border">
              {JSON.stringify(trace, null, 2)}
            </pre>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {trace.evaluated.map((target: any, index: number) => (
          <Card
            key={index}
            className={`transition-colors ${target.passed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Target #{target.id || `Target ${index + 1}`}
                </CardTitle>
                {getStatusBadge(target.passed)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Pass/Fail Summary */}
              <div className="flex items-center space-x-2">
                {getStatusIcon(target.passed)}
                <span
                  className={`text-sm font-medium ${target.passed ? "text-green-800" : "text-red-800"}`}
                >
                  {target.passed
                    ? "All rules passed"
                    : "Rule evaluation failed"}
                </span>
              </div>

              {/* Failed Rules */}
              {target.failed && target.failed.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-700">
                    Failed Evaluations:
                  </p>
                  <div className="space-y-1">
                    {target.failed.map((rule: string, ruleIndex: number) => (
                      <div
                        key={ruleIndex}
                        className="flex items-center space-x-2 text-sm text-red-600"
                      >
                        <XCircle className="h-3 w-3" />
                        <code className="bg-red-100 px-2 py-1 rounded text-xs">
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
                  <p className="text-sm font-medium text-green-700">
                    Successful Evaluations:
                  </p>
                  <div className="space-y-1">
                    {["country", "device", "time", "expires"].map(
                      (ruleType) => (
                        <div
                          key={ruleType}
                          className="flex items-center space-x-2 text-sm text-green-600"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <code className="bg-green-100 px-2 py-1 rounded text-xs">
                            {ruleType.replace("_", " ")}
                          </code>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Context Information */}
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">
                  Evaluation Context:
                </p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  ID: {target.id} • Status:{" "}
                  {target.passed ? "Selected" : "Rejected"}
                </code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Summary */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">
                Total Targets Evaluated: {trace.evaluated.length}
              </p>
              <p className="text-sm text-blue-700">
                Targets Passed:{" "}
                {trace.evaluated.filter((t: any) => t.passed).length}
              </p>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-100 text-blue-800 border-blue-300"
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
