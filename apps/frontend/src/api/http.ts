// One fetch wrapper for every API module. Errors carry the server's code and HTTP status
// (and, for a 409 on a task, the task as it is now, §7.2).
export type ApiError = Error & { code?: string; status?: number; task?: unknown };

// A 401 on a signed-in session means it expired or was revoked (AUTH-07). AuthProvider listens
// and signs the user out, so the route guard sends them to /login?redirect=<this page>.
export const SESSION_EXPIRED_EVENT = "trenno:session-expired";
export const notifySessionExpired = () => window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));

type Options = { body?: unknown; signal?: AbortSignal };

async function request<T>(method: string, url: string, { body, signal }: Options = {}): Promise<T> {
  const isFile = body instanceof Blob;
  const res = await fetch(url, {
    method,
    signal,
    headers: isFile ? { "Content-Type": body.type } : body !== undefined ? { "Content-Type": "application/json" } : { Accept: "application/json" },
    body: isFile ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) notifySessionExpired();
  if (!res.ok) {
    const err = new Error(data?.error?.message || data?.message || `Request failed with status ${res.status}`) as ApiError;
    err.code = data?.error?.code;
    err.status = res.status;
    err.task = data?.task;
    throw err;
  }
  return data as T;
}

export const http = {
  get: <T>(url: string, signal?: AbortSignal) => request<T>("GET", url, { signal }),
  post: <T>(url: string, body?: unknown) => request<T>("POST", url, { body }),
  patch: <T>(url: string, body?: unknown) => request<T>("PATCH", url, { body }),
  del: <T>(url: string, body?: unknown) => request<T>("DELETE", url, { body }),
};

// "?a=1&b=x" from the set values only ("" when none).
export function query(params: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  const s = qs.toString();
  return s ? `?${s}` : "";
}
