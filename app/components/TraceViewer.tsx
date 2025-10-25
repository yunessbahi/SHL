"use client";
import React from "react";

export default function TraceViewer({ trace }: { trace: any }) {
  if (!trace) return null;
  return (
    <div className=" border rounded p-3">
      <h3 className="font-semibold mb-2">Evaluation Trace</h3>
      <pre className="text-xs whitespace-pre-wrap">
        {JSON.stringify(trace, null, 2)}
      </pre>
    </div>
  );
}
