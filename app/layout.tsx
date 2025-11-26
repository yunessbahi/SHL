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
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Linker",
  description: "Create, manage and analyze smart links with advanced features",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
  adjustFontFallback: true,
});

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
  adjustFontFallback: true,
});

const mono = localFont({
  src: "../public/fonts/GeistMono-VariableFont_wght.ttf",
  display: "swap",
  variable: "--font-mono",
  preload: true,
  fallback: ["ui-monospace", "Cascadia Code", "system-ui", "arial"],
  //adjustFontFallback: true,
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

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          roboto.variable,
          mono.variable,
          "h-screen",
          "font-inter antialiased isolate",
          "bg-background text-foreground",
          "min-h-screen overflow-hidden",
          "font-feature-settings-normal",
          "text-rendering-optimizeLegibility",
        )}
        style={{
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Sidebar hasSession={!!user} user={safeUser}>
            <Header user={safeUser}>
              <div className="">{children}</div>
            </Header>
          </Sidebar>
          <Toaster theme="system" />
        </ThemeProvider>
      </body>
    </html>
  );
}
