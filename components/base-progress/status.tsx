"use client";

import * as React from "react";
import ProgressTTL from "@/components/ui/progress-ttl";

export default function BaseProgressStatus() {
  // Demo scenarios showing different states
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Demo data with different scenarios
  const demoLinks = [
    {
      name: "Active Link (1 hour remaining)",
      startDate: oneHourAgo.toISOString(),
      expiresAt: oneHourFromNow.toISOString(),
      createdAt: oneHourAgo.toISOString(),
    },
    {
      name: "Active Link (1 day remaining)",
      startDate: oneDayAgo.toISOString(),
      expiresAt: oneDayFromNow.toISOString(),
      createdAt: oneDayAgo.toISOString(),
    },
    {
      name: "Active Link (1 week remaining)",
      startDate: oneDayAgo.toISOString(),
      expiresAt: oneWeekFromNow.toISOString(),
      createdAt: oneDayAgo.toISOString(),
    },
    {
      name: "Future Link (starts tomorrow)",
      startDate: oneDayFromNow.toISOString(),
      expiresAt: oneWeekFromNow.toISOString(),
      createdAt: now.toISOString(),
    },
    {
      name: "Expired Link",
      startDate: new Date(
        now.getTime() - 2 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      expiresAt: oneHourAgo.toISOString(),
      createdAt: new Date(
        now.getTime() - 2 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
  ];

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Time to Expiry Demo</h2>
        <p className="text-gray-600">
          Demonstrating different link lifetime states
        </p>
      </div>

      <div className="space-y-4">
        {demoLinks.map((link, index) => (
          <div key={index} className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">{link.name}</h3>
            <ProgressTTL
              startDate={link.startDate}
              expiresAt={link.expiresAt}
              createdAt={link.createdAt}
              showTitle={false}
              className="w-full"
            />
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium mb-2">Features:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>
            • No continuous updates - calculates based on actual time remaining
          </li>
          <li>
            • Shows meaningful status: "Starts in X days", "X hours remaining",
            "Expired"
          </li>
          <li>• Progress based on time elapsed vs total time window</li>
          <li>• Color-coded progress bars for different time states</li>
          <li>• Updates every minute to avoid excessive re-renders</li>
        </ul>
      </div>
    </div>
  );
}
