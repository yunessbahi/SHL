// lib/getSafeSession.ts
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export interface SafeUser {
  id: string;
  email: string;
}

export interface SanitizedSession {
  user: SafeUser;
  expires_at?: number;
}

export interface SafeSessionResult {
  user: SafeUser | null;
  session: SanitizedSession | null;
}

export async function getSafeSession(
  request: NextRequest,
): Promise<SafeSessionResult | null> {
  try {
    const response = NextResponse.next();
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Authentication error:", error);
      return null;
    }

    if (!user) {
      return null;
    }

    const safeUser: SafeUser = {
      id: user.id,
      email: user.email || "",
    };

    const sanitizedSession: SanitizedSession = {
      user: safeUser,
    };

    return {
      user: safeUser,
      session: sanitizedSession,
    };
  } catch (error) {
    console.error("Error retrieving safe session:", error);
    return null;
  }
}
