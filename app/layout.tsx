import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "./components/sidebar/Sidebar";

export const metadata: Metadata = {
  title: "Smart Link Hub",
  description: "Create, manage and analyze smart links with advanced features",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {process.env.NODE_ENV === "development" && (
          <div className="fixed top-0 w-full bg-yellow-400 text-black p-1 text-center z-50">
            DEV MODE - localhost
          </div>
        )}

        <Sidebar>{children}</Sidebar>
      </body>
    </html>
  );
}
