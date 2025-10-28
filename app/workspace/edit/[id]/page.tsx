import { getSafeSession } from "@/lib/getSafeSession";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import EditPageClient from "./EditPageClient";

export default async function EditPage({ params }: { params: { id: string } }) {
  const headersList = headers();
  const request = new NextRequest(
    `${headersList.get("x-forwarded-proto") || "http"}://${headersList.get("host")}`,
    { headers: headersList },
  );
  const sessionResult = await getSafeSession(request);

  if (!sessionResult || !sessionResult.user) {
    redirect("/auth/login?redirectedFrom=/workspace/edit/" + params.id);
  }

  return (
    <EditPageClient user={sessionResult.user} linkId={parseInt(params.id)} />
  );
}
