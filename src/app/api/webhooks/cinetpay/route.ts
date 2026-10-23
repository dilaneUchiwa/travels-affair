import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, payments } from "@/db";
import { refreshBookingPayments } from "@/modules/payments/service";

export const dynamic = "force-dynamic";

/**
 * Notification CinetPay (cpm_trans_id). Le contenu n'est jamais cru sur parole :
 * on retrouve la transaction puis on interroge CinetPay (API de vérification) avant de valider.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const trans = String(form?.get("cpm_trans_id") ?? "");
  if (trans) {
    const row = await db.query.payments.findFirst({ where: eq(payments.providerReference, trans) });
    if (row) await refreshBookingPayments(row.bookingId);
  }
  return NextResponse.json({ received: true });
}
export const GET = POST; // CinetPay vérifie parfois l'URL par un simple GET
