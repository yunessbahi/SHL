"use client";

import React from "react";
import LinksDataTable from "@/app/components/links/LinksDataTable";
import { SafeUser } from "@/lib/getSafeSession";

interface PageClientProps {
  user: SafeUser;
}

export default function PageClient({ user }: PageClientProps) {
  return <LinksDataTable user={user} />;
}
