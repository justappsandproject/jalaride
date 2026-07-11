const BACKEND_URL = process.env.BACKEND_API_URL ?? "https://jala-ride-api.onrender.com";

/** Public mobile API base — safe for client-side share/trip fetches */
export const MOBILE_API_URL =
  process.env.NEXT_PUBLIC_MOBILE_API_URL ?? "https://jala-ride-api.onrender.com";

let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function backendAdminFetch(path: string, init?: RequestInit) {
  const token = await getAdminToken();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

async function getAdminToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const phone = process.env.BACKEND_ADMIN_PHONE ?? "+10000000000";
  const password = process.env.BACKEND_ADMIN_PASSWORD ?? "admin123";
  const res = await fetch(`${BACKEND_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password }),
  });
  if (!res.ok) throw new Error("Backend admin login failed");
  const data = (await res.json()) as { token: string };
  cachedToken = data.token;
  tokenExpiry = Date.now() + 50 * 60 * 1000;
  return cachedToken;
}
