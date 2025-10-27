import { getSafeSession } from "@/lib/getSafeSession";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import DashboardPageClient from "./PageClient";

export default async function Dashboard() {
  const headersList = headers();
  const request = new NextRequest(
    `${headersList.get("x-forwarded-proto") || "http"}://${headersList.get("host")}`,
    { headers: headersList },
  );
  const sessionResult = await getSafeSession(request);

  if (!sessionResult || !sessionResult.user) {
    redirect("/auth/login?redirectedFrom=/dashboard");
  }

  return <DashboardPageClient user={sessionResult.user} />;
}
