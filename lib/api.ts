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
  const fullUrl = `${base}${path}`;

  console.log("API Fetch URL:", fullUrl);
  console.log("API Fetch Headers:", Object.fromEntries(headers.entries()));

  try {
    const response = await fetch(fullUrl, { ...options, headers });
    console.log("API Fetch Response Status:", response.status);
    return response;
  } catch (error) {
    console.error("API Fetch Error:", error);
    console.error("Failed to fetch from:", fullUrl);
    throw error;
  }
}
