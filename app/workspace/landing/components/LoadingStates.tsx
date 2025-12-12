"use client";

interface LoadingStatesProps {
  type?: "full" | "section" | "inline";
  message?: string;
}

export default function LoadingStates({
  type = "section",
  message = "Loading...",
}: LoadingStatesProps) {
  if (type === "full") {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <div className="mx-auto mb-4">
            <svg
              className="w-12 h-12 text-blue-600 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">{message}</p>
        </div>
      </div>
    );
  }

  if (type === "section") {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto mb-4">
          <svg
            className="w-8 h-8 text-blue-500 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-gray-500">{message}</p>
      </div>
    );
  }

  // Inline loading
  return (
    <span className="inline-flex items-center space-x-2">
      <svg
        className="w-4 h-4 text-blue-500 animate-spin"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="text-sm text-gray-500">{message}</span>
    </span>
  );
}
