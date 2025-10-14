import "./globals.css";
import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
