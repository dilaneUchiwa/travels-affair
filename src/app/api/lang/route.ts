import { NextResponse, type NextRequest } from "next/server";
import { LANG_COOKIE, isLang } from "@/i18n";

/** GET /api/lang?l=en&next=/vols : mémorise la langue choisie (cookie d'un an) puis revient à la page. */
export function GET(req: NextRequest) {
  const l = req.nextUrl.searchParams.get("l");
  const next = req.nextUrl.searchParams.get("next") ?? "/";
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const res = NextResponse.redirect(new URL(target, req.url));
  if (isLang(l)) res.cookies.set(LANG_COOKIE, l, { path: "/", maxAge: 31_536_000, sameSite: "lax" });
  return res;
}
