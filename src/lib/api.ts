/* Tiny fetch wrapper for the frontend → API routes. Sends/receives JSON,
   includes the session cookie, and throws ApiError(message) on non-2xx. */

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        // Marks the request as coming from our own app. The browser address bar
        // and cross-site JS cannot set this header, so middleware uses it to
        // reject direct navigation to /api/* (see src/middleware.ts).
        "x-requested-by": "ocare-web",
        ...options.headers,
      },
      ...options,
    });
  } catch {
    /* fetch() only rejects on a network-level failure: offline, DNS, or the
       server unreachable. Surface a clear connection message (status 0). */
    throw new ApiError(0, "Couldn't reach the server. Please check your internet connection and try again.");
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* no body (e.g. an unhandled 500 returns HTML, not JSON) */
  }
  if (!res.ok) {
    const fallback =
      res.status >= 500
        ? "We're having trouble reaching the server. Please try again in a moment."
        : "Something went wrong. Please try again.";
    const message = (data as { error?: string } | null)?.error ?? fallback;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export const api = {
  get: <T = unknown>(path: string) => request<T>(path, { method: "GET" }),
  post: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) }),
  del: <T = unknown>(path: string) => request<T>(path, { method: "DELETE" }),
};
