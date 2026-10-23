import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/modules/auth/token";

// Première barrière (session valide). Les rôles et la propriété des ressources sont revérifiés
// côté serveur dans les pages et les services (défense en profondeur).
export async function middleware(req: NextRequest) {
  const claims = await verifyToken(req.cookies.get(SESSION_COOKIE)?.value);
  const path = req.nextUrl.pathname;
  if (!claims) {
    const url = req.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  if (path.startsWith("/admin") && claims.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/mon-compte/:path*", "/reservation/:path*"] };
