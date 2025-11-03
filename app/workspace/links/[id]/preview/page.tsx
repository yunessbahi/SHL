import { getSafeSession } from "@/lib/getSafeSession";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import PreviewPageClient from "./PageClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PreviewPage({ params }: PageProps) {
  const { id } = await params;
  const headersList = headers();
  const request = new NextRequest(
    `${headersList.get("x-forwarded-proto") || "http"}://${headersList.get("host")}`,
    { headers: headersList },
  );
  const sessionResult = await getSafeSession(request);

  if (!sessionResult || !sessionResult.user) {
    redirect("/auth/login?redirectedFrom=/workspace/links");
  }

  return <PreviewPageClient user={sessionResult.user} id={id} />;
}
