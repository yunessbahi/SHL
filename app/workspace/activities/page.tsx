import { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Activities Center | Workspace",
  description: "View and manage all your workspace activities",
};

export default function ActivitiesPage() {
  return <PageClient />;
}
