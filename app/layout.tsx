//app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "@/app/components/sidebar/Sidebar";
import Header from "@/app/components/Header";
import { Inter, Roboto } from "next/font/google";
import { cn } from "@/lib/utils";
import localFont from "next/font/local";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SafeUser } from "@/lib/getSafeSession";

export const metadata: Metadata = {
  title: "Linker",
  description: "Create, manage and analyze smart links with advanced features",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // Define a CSS variable
});

const roboto = Roboto({
  weight: ["400", "700"], // Specify desired weights
  subsets: ["latin"], // Specify desired subsets
  variable: "--font-roboto", // Define a CSS variable name
  display: "swap", // Optimize font loading
});

const mono = localFont({
  src: "../public/fonts/GeistMono-VariableFont_wght.ttf", // Adjust path as needed
  display: "swap", // Recommended for better performance
  variable: "--font-mono", // Optional: for use with CSS variables
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Extract safe user data
  const safeUser: SafeUser | null = user
    ? {
        id: user.id,
        email: user.email || "",
      }
    : null;

  // Get theme from cookies for server-side rendering
  const theme = cookieStore.get("theme")?.value || "light";

  return (
    <html
      lang="en"
      className={cn(
        `${roboto.variable} ${mono.variable}`,
        theme === "dark" ? "dark" : "",
      )}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="font-inter">
        <Sidebar hasSession={!!user} user={safeUser}>
          <Header user={safeUser}>
            <div className="p-4">{children}</div>
          </Header>
        </Sidebar>
      </body>
    </html>
  );
}
