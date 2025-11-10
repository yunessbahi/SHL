import { getSafeSession } from "@/lib/getSafeSession";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import LinksPageClient from "./PageClient";
import { Badge } from "@/components/ui/badge";

export default async function Links() {
  const headersList = headers();
  const request = new NextRequest(
    `${headersList.get("x-forwarded-proto") || "http"}://${headersList.get("host")}`,
    { headers: headersList },
  );
  const sessionResult = await getSafeSession(request);

  if (!sessionResult || !sessionResult.user) {
    redirect("/auth/login?redirectedFrom=/workspace/links");
  }

  return (
    <div className="min-h-screen overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-accent-foreground">
            Links Management
          </h1>
          <p className="text-gray-600 mt-1">
            Testing the new data table component for links management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            New Feature
          </Badge>
        </div>
      </div>
      <LinksPageClient user={sessionResult.user} />
    </div>
  );
}
