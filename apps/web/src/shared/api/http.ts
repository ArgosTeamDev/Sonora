// Relative "/api" in dev relies on Vite's proxy (vite.config.ts) forwarding
// to the local NestJS server — set VITE_API_URL (in .env.production or the
// deployment's environment) once the frontend and API are on different
// origins in production.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

interface ApiErrorBody {
  code?: string;
  message?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include", // the auth cookie is httpOnly, never touched by JS
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body: ApiErrorBody = await response.json().catch(() => ({}));
    throw new HttpError(response.status, body.code ?? "UNKNOWN", body.message ?? response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const http = {
  get: <T>(path: string): Promise<T> => request<T>(path),
  post: <T>(path: string, body: unknown): Promise<T> =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown): Promise<T> =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: <T>(path: string): Promise<T> => request<T>(path, { method: "DELETE" }),
};
