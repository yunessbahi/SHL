import { Metadata } from "next";
import LandingPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Workspace Landing",
  description:
    "Google-like workspace landing page with activity summary and quick access",
};

export default function WorkspaceLandingPage() {
  return (
    <div className="flex overflow-hidden">
      <LandingPageClient />
    </div>
  );
}
