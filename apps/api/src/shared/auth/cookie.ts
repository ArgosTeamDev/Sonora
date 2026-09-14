import type { Response } from "express";

export const COOKIE_NAME = "sonora_token";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days, matches the JWT's own expiry

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE_MS,
    path: "/",
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

// No cookie-parser dependency — the cookie header is one name=value pair,
// not worth a whole package.
export function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  const prefix = `${name}=`;
  const match = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}
