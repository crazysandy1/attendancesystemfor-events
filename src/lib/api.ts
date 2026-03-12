const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function invokeFunction(
  functionName: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    token?: string;
    queryParams?: Record<string, string>;
  } = {}
) {
  const { method = "POST", body, token, queryParams } = options;

  let url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  if (queryParams) {
    const params = new URLSearchParams(queryParams);
    url += `?${params.toString()}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return res;
}

export async function getFingerprint(): Promise<string> {
  const raw = navigator.userAgent + screen.width + screen.height;
  const msgBuffer = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function getAdminToken(): string | null {
  return sessionStorage.getItem("admin_session");
}

export function setAdminToken(token: string): void {
  sessionStorage.setItem("admin_session", token);
}

export function clearAdminToken(): void {
  sessionStorage.removeItem("admin_session");
}
