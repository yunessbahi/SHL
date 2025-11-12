import { getSafeSession } from "@/lib/getSafeSession";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import ExplorePageClient from "./PageClient";

export default async function ExplorePage() {
  const headersList = headers();
  const request = new NextRequest(
    `${headersList.get("x-forwarded-proto") || "http"}://${headersList.get("host")}`,
    { headers: headersList },
  );
  const sessionResult = await getSafeSession(request);

  if (!sessionResult || !sessionResult.user) {
    redirect("/auth/login?redirectedFrom=/analytics/explore");
  }

  return (
    <div className="min-h-screen overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-accent-foreground">
            Analytics Explorer
          </h1>
          <p className="text-gray-600 mt-1">
            Deep dive into your data with custom filters, metrics, and
            dimensions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm font-medium">
            Advanced Analytics
          </div>
        </div>
      </div>
      <ExplorePageClient user={sessionResult.user} />
    </div>
  );
}
