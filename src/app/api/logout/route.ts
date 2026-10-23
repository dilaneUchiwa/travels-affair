import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/modules/auth/token";

/** Déconnexion par navigation classique (utilisable depuis l'administration, autre root layout). */
export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
