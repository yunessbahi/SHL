// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";
import type { User } from "@supabase/supabase-js";

const PUBLIC_PATHS = ["/", "/auth/login", "/auth/signup", "/demo"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Sync session if possible
  const { response, user }: { response: NextResponse; user: User | null } =
    await updateSession(request);

  // 2. If protected route and no user → redirect to login with redirectedFrom
  if (!user) {
    const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
    if (!isPublic) {
      const redirectUrl = new URL("/auth/login", request.url);
      redirectUrl.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 3. Signed-in user accessing protected route → allow
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
