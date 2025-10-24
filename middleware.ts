// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";
import type { Session } from "@supabase/supabase-js";

const PUBLIC_PATHS = ["/", "/auth/login", "/auth/signup", "/demo"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Sync session if possible
  const {
    response,
    session,
  }: { response: NextResponse; session: Session | null } =
    await updateSession(request);

  // 2. If the route is public
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  if (isPublic) {
    // Allow access to public routes regardless of auth status
    return response;
  }

  // 3. If protected route and no session → redirect to login with redirectedFrom
  if (!session) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 4. Signed-in user accessing protected route → allow
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
