import { resolveGatewayRoute } from "@project/shared";

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

interface GatewayBody<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Adaptador al endpoint único: las llamadas REST de siempre (`http.get("/albums/1")`)
 * se traducen a `/api/gateway?action=obtener_album&id=1`. Ninguna página ni hook
 * cambia; solo cambia lo que viaja por la red.
 */
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = new URL(path, "http://adapter.local");
  const route = resolveGatewayRoute(method, url.pathname);
  if (!route) {
    throw new HttpError(404, "NOT_FOUND", `Sin acción del gateway para ${method} ${url.pathname}.`);
  }

  // Los :params viajan por la query en GET/DELETE y dentro del body en el resto.
  const query = new URLSearchParams({ action: route.action });
  url.searchParams.forEach((value, key) => query.set(key, value));
  let payload: string | undefined;
  if (method === "GET" || method === "DELETE") {
    for (const [key, value] of Object.entries(route.params)) query.set(key, value);
  } else {
    payload = JSON.stringify({ ...(body as object | undefined), ...route.params });
  }

  const response = await fetch(`${API_BASE_URL}/gateway?${query}`, {
    method,
    body: payload,
    credentials: "include", // the auth cookie is httpOnly, never touched by JS
    headers: { "Content-Type": "application/json" },
  });

  const result: GatewayBody<T> = await response.json().catch(() => ({ success: false }));
  if (!response.ok || !result.success) {
    throw new HttpError(response.status, result.code ?? "UNKNOWN", result.error ?? response.statusText);
  }
  return (result.data ?? undefined) as T;
}

export const http = {
  get: <T>(path: string): Promise<T> => request<T>("GET", path),
  post: <T>(path: string, body: unknown): Promise<T> => request<T>("POST", path, body),
  patch: <T>(path: string, body: unknown): Promise<T> => request<T>("PATCH", path, body),
  put: <T>(path: string, body: unknown): Promise<T> => request<T>("PUT", path, body),
  del: <T>(path: string): Promise<T> => request<T>("DELETE", path),
};
