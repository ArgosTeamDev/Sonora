import { type CanActivate, type ExecutionContext, HttpException, HttpStatus, type Type } from "@nestjs/common";
import type { Request } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

// In-memory fixed-window limiter, one bucket per (guard, client IP). Enough
// for a single API process behind nginx; it resets on restart and isn't
// shared between processes — move it to Redis if the API ever scales out.
// Not using @nestjs/throttler to keep the dependency list as small as the
// rest of the auth code (no cookie-parser, scrypt instead of bcrypt).
export function rateLimit(max: number, windowMs: number, message: string): Type<CanActivate> {
  const buckets = new Map<string, Bucket>();

  class RateLimitGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const req = context.switchToHttp().getRequest<Request>();
      const key = req.ip ?? "unknown";
      const now = Date.now();

      // Opportunistic cleanup so the map can't grow without bound.
      if (buckets.size > 5000) {
        for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
      }

      const bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      if (bucket.count >= max) {
        throw new HttpException({ code: "RATE_LIMITED", message }, HttpStatus.TOO_MANY_REQUESTS);
      }
      bucket.count += 1;
      return true;
    }
  }

  return RateLimitGuard;
}

const MINUTE = 60_000;

export const LoginRateLimit = rateLimit(10, 15 * MINUTE, "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.");
export const RegisterRateLimit = rateLimit(5, 60 * MINUTE, "Demasiados registros desde tu red. Inténtalo más tarde.");
export const PasswordRateLimit = rateLimit(5, 15 * MINUTE, "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.");
