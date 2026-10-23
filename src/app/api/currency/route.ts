import { NextResponse, type NextRequest } from "next/server";
import { CURRENCY_COOKIE } from "@/shared/currency";
import { isCurrency } from "@/shared/money";

/** GET /api/currency?c=EUR&next=/vols : mémorise la devise d'affichage (cookie d'un an). */
export function GET(req: NextRequest) {
  const c = req.nextUrl.searchParams.get("c");
  const next = req.nextUrl.searchParams.get("next") ?? "/";
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const res = NextResponse.redirect(new URL(target, req.url));
  if (c && isCurrency(c)) res.cookies.set(CURRENCY_COOKIE, c, { path: "/", maxAge: 31_536_000, sameSite: "lax" });
  return res;
}
