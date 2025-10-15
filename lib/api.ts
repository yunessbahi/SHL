import { createClient } from "@/lib/supabase/client";

export async function authFetch(url: string, options: RequestInit = {}) {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(process.env.NEXT_PUBLIC_API_URL + url, {
    ...options,
    headers,
  });
}
