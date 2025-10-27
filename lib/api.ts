// lib/api.ts
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export async function authFetch(url: string, options: RequestInit = {}) {
  // Always use browser client since this is called from client components
  const supabase = createBrowserClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("No authenticated session. Please sign in.");

  const token = session.access_token;

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.body)
    headers.set("Content-Type", "application/json");

  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;

  return fetch(`${base}${path}`, { ...options, headers });
}
