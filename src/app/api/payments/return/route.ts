import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { getBookingFor } from "@/modules/bookings/service";
import { refreshBookingPayments } from "@/modules/payments/service";
import { AppError } from "@/shared/errors";

export const dynamic = "force-dynamic";

/** Retour du client depuis Stripe / PayPal : on vérifie auprès du prestataire (jamais sur la seule foi de l'URL). */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("booking") ?? "";
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL(`/connexion?next=${encodeURIComponent(`/mon-compte/reservations/${id}`)}`, req.url));
  try {
    await getBookingFor(user, id);
  } catch (e) {
    if (e instanceof AppError) return NextResponse.redirect(new URL("/mon-compte", req.url));
    throw e;
  }
  const outcome = await refreshBookingPayments(id);
  const target = outcome === "SUCCEEDED" ? `/mon-compte/reservations/${id}?paye=1` : outcome === "FAILED" ? `/reservation/${id}/paiement?echec=1` : `/reservation/${id}/paiement?attente=1`;
  return NextResponse.redirect(new URL(target, req.url));
}
