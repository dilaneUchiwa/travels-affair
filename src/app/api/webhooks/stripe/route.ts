import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, payments } from "@/db";
import { env } from "@/shared/env";
import { refreshBookingPayments } from "@/modules/payments/service";
import { verifyStripeSignature } from "@/modules/payments/providers/stripe";

export const dynamic = "force-dynamic";

/** Webhook Stripe : filet de sécurité si le client ferme son navigateur avant le retour sur le site. */
export async function POST(req: NextRequest) {
  if (!env.STRIPE_WEBHOOK_SECRET) return new NextResponse("Webhook non configuré", { status: 404 });
  const raw = await req.text();
  if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET)) return new NextResponse("Signature invalide", { status: 400 });
  const event = JSON.parse(raw) as { type: string; data?: { object?: { id?: string } } };
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.expired") {
    const sessionId = event.data?.object?.id;
    const row = sessionId ? await db.query.payments.findFirst({ where: eq(payments.providerReference, sessionId) }) : null;
    if (row) await refreshBookingPayments(row.bookingId); // la vérification interroge Stripe : le webhook ne suffit pas à valider
  }
  return NextResponse.json({ received: true });
}
