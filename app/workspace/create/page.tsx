import { getSafeSession } from "@/lib/getSafeSession";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { Suspense } from "react";
import CreatePageClient from "./CreatePageClient";

export default async function CreatePage() {
  const headersList = headers();
  const request = new NextRequest(
    `${headersList.get("x-forwarded-proto") || "http"}://${headersList.get("host")}`,
    { headers: headersList },
  );
  const sessionResult = await getSafeSession(request);

  if (!sessionResult || !sessionResult.user) {
    redirect("/auth/login?redirectedFrom=/workspace/create");
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatePageClient user={sessionResult.user} />
    </Suspense>
  );
}
