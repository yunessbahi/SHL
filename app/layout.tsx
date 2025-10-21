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
        <Sidebar>{children}</Sidebar>
      </body>
    </html>
  );
}
