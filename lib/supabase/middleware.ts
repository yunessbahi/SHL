// lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; user: User | null }> {
  const response = NextResponse.next();

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value;
      },
      set(name, value, options) {
        response.cookies.set(name, value, options);
      },
      remove(name, options) {
        response.cookies.delete(name);
      },
    },
  });

  // Handle OAuth callback code exchange
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    console.log("[DEBUG] Middleware: Exchanging OAuth code for session");
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[DEBUG] Middleware: Code exchange error", error.message);
    } else {
      console.log("[DEBUG] Middleware: Code exchange successful");
    }
  }

  // refresh session if needed
  console.log(
    "[DEBUG] Middleware: Refreshing session for",
    request.nextUrl.pathname,
  );
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  console.log("[DEBUG] Middleware: User refresh result", {
    hasUser: !!user,
    error: error?.message,
  });
  return { response, user };
}
