import { CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { COOKIE_NAME, parseCookie } from "./cookie";
import { verifyToken } from "./jwt";

export interface AuthUser {
  id: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthUser;
}

// Applied per-route (not globally): most GETs stay public, only mutations
// that need to know "who is this" opt in.
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = parseCookie(req.headers.cookie, COOKIE_NAME);
    if (!token) {
      throw new UnauthorizedException({ code: "UNAUTHENTICATED", message: "Iniciá sesión para continuar." });
    }
    const payload = verifyToken(token);
    if (!payload) {
      throw new UnauthorizedException({ code: "UNAUTHENTICATED", message: "Sesión inválida o expirada." });
    }
    req.authUser = { id: payload.sub, username: payload.username };
    return true;
  }
}
