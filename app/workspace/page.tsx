"use client";

import React from "react";

export default function Workspace() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Workspace
          </h1>
          <p className="text-gray-600">
            Welcome to your workspace. This is where you can manage your
            projects and collaborate.
          </p>
          {/* Add more content here as needed */}
        </div>
      </main>
    </div>
  );
}
