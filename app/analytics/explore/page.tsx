import { Badge } from "@/components/ui/badge";
import { getSafeSession } from "@/lib/getSafeSession";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
          <h1 className="text-3xl font-bold tracking-tight text-muted-foreground">
            Analytics Explorer
          </h1>
          <p className="text-md text-muted-foreground">
            Deep dive into your data with custom filters, metrics, and
            dimensions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-neutral-100/10 text-neutral-700 border-neutral-400 dark:bg-neutral-500/10 dark:text-neutral-400 dark:border-neutral-700"
          >
            Advanced Analytics
          </Badge>
        </div>
      </div>
      <ExplorePageClient />
    </div>
  );
}
