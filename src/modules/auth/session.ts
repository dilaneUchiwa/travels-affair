import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signToken, verifyToken } from "./token";

export async function startSession(user: { id: string; role: string }) {
  cookies().set(SESSION_COOKIE, await signToken({ userId: user.id, role: user.role }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function endSession() {
  cookies().delete(SESSION_COOKIE);
}

/** Utilisateur courant (mis en cache pour la durée d'une requête). */
export const getCurrentUser = cache(async () => {
  const claims = await verifyToken(cookies().get(SESSION_COOKIE)?.value);
  if (!claims) return null;
  return (await db.query.users.findFirst({ where: eq(users.id, claims.userId) })) ?? null;
});

export async function requireUser(next?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
