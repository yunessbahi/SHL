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
	// Build absolute URL without causing proxy 307 redirects
	const inputStr = String(input);
	const absolute = inputStr.startsWith("http://") || inputStr.startsWith("https://");
	const url = absolute
		? inputStr
		: `${baseUrl.replace(/\/+$/, "")}/${inputStr.replace(/^\/+/, "")}`;

	return fetch(
        url, {
		...init,
		headers,
	});
}
