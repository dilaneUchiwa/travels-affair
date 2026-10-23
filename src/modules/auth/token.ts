// Edge-safe (utilisé par le middleware) : uniquement jose, aucune dépendance Node/Prisma.
import { jwtVerify, SignJWT } from "jose";
import { getAuthSecret } from "@/shared/env";

export const SESSION_COOKIE = "ta_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionClaims = { userId: string; role: string };

export async function signToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getAuthSecret());
}

export async function verifyToken(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (!payload.sub || typeof payload.role !== "string") return null;
    return { userId: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}
