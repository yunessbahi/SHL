"use client";

import { useEffect, useState } from "react";
import { SafeUser } from "@/lib/getSafeSession";
import SingleLinkForm from "@/app/components/SingleLinkForm";
import SmartLinkForm from "@/app/components/SmartLinkForm";
import { authFetch } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";

interface EditPageClientProps {
  user: SafeUser;
  linkId: number;
}

export default function EditPageClient({ user, linkId }: EditPageClientProps) {
  const [linkData, setLinkData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchLinkData = async () => {
      try {
        const res = await authFetch(`/api/workspace/links/${linkId}`);
        if (res.ok) {
          const data = await res.json();
          setLinkData(data);
          console.log("data: ", data);
        } else {
          setError("Failed to load link data");
        }
      } catch (err) {
        setError("Failed to load link data");
      } finally {
        setLoading(false);
      }
    };

    fetchLinkData();
  }, [linkId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!linkData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Link Not Found
          </h1>
          <p className="text-gray-600">
            The requested link could not be found.
          </p>
        </div>
      </div>
    );
  }

  const isSmartLink = linkData.link_type === "smart";

  return isSmartLink ? (
    <SmartLinkForm
      userId={user.id}
      linkId={linkId}
      initialData={linkData}
      isEdit={true}
    />
  ) : (
    <SingleLinkForm
      userId={user.id}
      linkId={linkId}
      initialData={linkData}
      isEdit={true}
    />
  );
}
