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
          <h1 className="text-3xl font-bold tracking-tight text-muted-foreground">
            Links Management
          </h1>
          <p className="text-md text-muted-foreground">
            Testing the new data table component for links management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-neutral-100/10 text-neutral-700 border-neutral-400 dark:bg-neutral-500/10 dark:text-neutral-400 dark:border-neutral-700"
          >
            New Feature
          </Badge>
        </div>
      </div>
      <LinksPageClient user={sessionResult.user} />
    </div>
  );
}
