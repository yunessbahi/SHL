"use client";

import { useSearchParams } from "next/navigation";
import { SafeUser } from "@/lib/getSafeSession";
import { Toaster } from "@/components/ui/sonner";
import SingleLinkForm from "@/app/components/SingleLinkForm";
import SmartLinkForm from "@/app/components/SmartLinkForm";

interface CreatePageClientProps {
  user?: SafeUser;
}

export default function CreatePageClient({ user }: CreatePageClientProps) {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">Please log in to create links.</p>
        </div>
      </div>
    );
  }

  if (type === "single") {
    return (
      <>
        <SingleLinkForm userId={user.id} />
        <Toaster />
      </>
    );
  }

  if (type === "smart") {
    return (
      <>
        <SmartLinkForm userId={user.id} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Invalid Link Type
        </h1>
        <p className="text-gray-600">
          Please specify a valid link type: single or smart.
        </p>
      </div>
    </div>
  );
}
