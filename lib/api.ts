import { createClient } from "@/lib/supabase/client";

export async function authFetch(url: string, options: RequestInit = {}) {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("No authenticated session. Please sign in.");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.body)
    headers.set("Content-Type", "application/json");

  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  const full = `${base}${path}`;

  return fetch(full, {
    ...options,
    headers,
  });
}
