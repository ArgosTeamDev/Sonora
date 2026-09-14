import jwt from "jsonwebtoken";

// Dev-only fallback — set JWT_SECRET in the environment for anything real.
const SECRET = process.env.JWT_SECRET ?? "sonora-dev-secret-change-me";
const EXPIRES_IN = "30d";

export interface JwtPayload {
  sub: string; // user id
  username: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
