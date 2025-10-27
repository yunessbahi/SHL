import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Session } from "@supabase/supabase-js";

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
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Authentication error:", error);
      return null;
    }

    if (!session) {
      return null;
    }

    const safeUser: SafeUser = {
      id: session.user.id,
      email: session.user.email || "",
    };

    const sanitizedSession: SanitizedSession = {
      user: safeUser,
      expires_at: session.expires_at,
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
