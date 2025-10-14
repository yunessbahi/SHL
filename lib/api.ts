export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
	// Dynamically import to avoid SSR access of window
	const { createClient } = await import("./supabase/client");
	const supabase = createClient();
	const { data } = await supabase.auth.getSession();
	const token = data.session?.access_token;
	const headers = new Headers(init.headers || {});
	if (token) headers.set("Authorization", `Bearer ${token}`);
	headers.set("Content-Type", "application/json");
	
	const baseUrl = process.env.NEXT_PUBLIC_API_URL;
	if (!baseUrl) {
		throw new Error("NEXT_PUBLIC_API_URL environment variable is not set");
	}
	
	return fetch(new URL(String(input), baseUrl), {
		...init,
		headers,
	});
}
