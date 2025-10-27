import { getSafeSession } from "@/lib/getSafeSession";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import TargetsPageClient from "./PageClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TargetsPage({ params }: PageProps) {
  const { id } = await params;
  const headersList = headers();
  const request = new NextRequest(
    `${headersList.get("x-forwarded-proto") || "http"}://${headersList.get("host")}`,
    { headers: headersList },
  );
  const sessionResult = await getSafeSession(request);

  if (!sessionResult || !sessionResult.user) {
    redirect("/auth/login?redirectedFrom=/links");
  }

  return <TargetsPageClient user={sessionResult.user} id={id} />;
}
