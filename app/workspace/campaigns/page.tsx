import React from "react";
import { getSafeSession } from "@/lib/getSafeSession";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import CampaignsPageClient from "./PageClient";

export default async function Campaigns() {
  const headersList = headers();
  const request = new NextRequest(
    `${headersList.get("x-forwarded-proto") || "http"}://${headersList.get("host")}`,
    { headers: headersList },
  );
  const sessionResult = await getSafeSession(request);

  if (!sessionResult || !sessionResult.user) {
    redirect("/auth/login?redirectedFrom=/workspace/campaigns");
  }

  return <CampaignsPageClient user={sessionResult.user} />;
}
