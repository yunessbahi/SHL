import type { Metadata } from "next";
import { getSafeSession } from "@/lib/getSafeSession";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import LinksTableDemoPage from "./page";

export const metadata: Metadata = {
  title: "Links Data Table Demo",
  description:
    "Demo page for the new filterable data table component for links management",
};

export default async function LinksTableDemoLayout() {
  const headersList = headers();
  const request = new NextRequest(
    `${headersList.get("x-forwarded-proto") || "http"}://${headersList.get("host")}`,
    { headers: headersList },
  );
  const sessionResult = await getSafeSession(request);

  if (!sessionResult || !sessionResult.user) {
    redirect("/auth/login?redirectedFrom=/workspace/links-table-demo");
  }

  return <LinksTableDemoPage user={sessionResult.user} />;
}
