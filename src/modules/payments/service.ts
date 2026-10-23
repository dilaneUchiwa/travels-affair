import { enabledPaymentMethods, loadConfig } from "@/modules/settings/service";
import { and, desc, eq } from "drizzle-orm";
import { db, payments } from "@/db";
import { env } from "@/shared/env";
import { conflict } from "@/shared/errors";
import { isCurrency } from "@/shared/money";
import { changeStatus, getBookingFor } from "@/modules/bookings/service";
import { getProvider } from "./registry";
import { paymentInputSchema, type PaymentMethod } from "./schemas";
import type { VerifyResult } from "./provider";

export type PayOutcome = { paid: true } | { paid: false; redirectUrl?: string; pending: true };

/** Clôture une tentative de paiement, une seule fois même si retour navigateur et webhook arrivent ensemble. */
export async function settlePayment(paymentId: string, result: VerifyResult): Promise<boolean> {
  if (result.status === "PENDING") return false;
  const [res] = await db
    .update(payments)
    .set({ status: result.status, failureReason: result.status === "FAILED" ? result.reason : null })
    .where(and(eq(payments.id, paymentId), eq(payments.status, "PENDING")));
  if (res.affectedRows === 0) return false; // déjà traité (réclamation atomique : une seule ligne PENDING passe)
  const payment = await db.query.payments.findFirst({ where: eq(payments.id, paymentId) });
  if (!payment) return false;
  if (result.status === "SUCCEEDED") {
    try {
      await changeStatus(payment.bookingId, "PAID");
    } catch {
      // La réservation n'attend plus de paiement (annulée entre-temps) : l'argent est reçu, à rembourser par l'équipe.
      await db.update(payments).set({ failureReason: "Paiement reçu alors que la réservation n'était plus en attente : à rembourser." }).where(eq(payments.id, paymentId));
    }
  }
  return result.status === "SUCCEEDED";
}

export async function payBooking(user: { id: string; role: string }, bookingId: string, raw: unknown): Promise<PayOutcome> {
  const input = paymentInputSchema.parse(raw);
  await loadConfig();
  if (!enabledPaymentMethods().includes(input.method)) throw conflict("Ce moyen de paiement n'est pas disponible.");
  const booking = await getBookingFor(user, bookingId);
  if (booking.status !== "PENDING_PAYMENT") throw conflict("Cette réservation n'attend plus de paiement.");
  if (!isCurrency(booking.currency)) throw conflict("Devise non prise en charge.");
  if (booking.payments.some((p) => p.status === "PENDING")) throw conflict("Un paiement est déjà en cours de traitement pour cette réservation.");

  const provider = getProvider(input.method);
  // Chaque tentative est tracée (audit), réussie, refusée ou en cours.
  const paymentId = crypto.randomUUID();
  await db
    .insert(payments)
    .values({ id: paymentId, bookingId: booking.id, method: input.method, provider: provider.id, amount: booking.total, currency: booking.currency, status: "PENDING" });

  const result = await provider.charge({
    reference: booking.reference,
    paymentId,
    amount: booking.total,
    currency: booking.currency,
    description: `${booking.title} (${booking.reference})`,
    input,
    returnUrl: `${env.APP_URL}/api/payments/return?booking=${booking.id}`,
    notifyUrl: `${env.APP_URL}/api/webhooks/cinetpay`,
    lang: booking.user.lang === "en" ? "en" : "fr",
    customer: { name: booking.user.name, email: booking.user.email, phone: "phone" in input ? input.phone : undefined },
    cancelUrl: `${env.APP_URL}/reservation/${booking.id}/paiement?annule=1`,
  });

  if (result.status === "PENDING") {
    await db.update(payments).set({ providerReference: result.providerReference }).where(eq(payments.id, paymentId));
    return { paid: false, pending: true, redirectUrl: result.redirectUrl };
  }
  if (result.status === "SUCCEEDED") {
    await db.update(payments).set({ providerReference: result.providerReference }).where(eq(payments.id, paymentId));
    await settlePayment(paymentId, { status: "SUCCEEDED" });
    return { paid: true };
  }
  await settlePayment(paymentId, { status: "FAILED", reason: result.reason });
  throw conflict(`Paiement refusé : ${result.reason}`);
}

/** Interroge le prestataire pour les paiements en cours d'une réservation. */
export async function refreshBookingPayments(bookingId: string): Promise<"SUCCEEDED" | "FAILED" | "PENDING" | "NONE"> {
  const pending = await db.query.payments.findMany({ where: and(eq(payments.bookingId, bookingId), eq(payments.status, "PENDING")), orderBy: desc(payments.createdAt) });
  if (pending.length === 0) return "NONE";
  let last: "SUCCEEDED" | "FAILED" | "PENDING" = "PENDING";
  for (const p of pending) {
    const provider = getProvider(p.method as PaymentMethod);
    if (!provider.verify || !p.providerReference) continue;
    const r = await provider.verify(p.providerReference);
    await settlePayment(p.id, r);
    last = r.status;
  }
  return last;
}

/** Tâche planifiée : filet de sécurité si le client n'est jamais revenu sur le site. */
export async function refreshAllPending() {
  const rows = await db.select().from(payments).where(eq(payments.status, "PENDING"));
  const ids = [...new Set(rows.map((r) => r.bookingId))];
  for (const id of ids) await refreshBookingPayments(id);
  return ids.length;
}

export async function failStalePending(maxAgeMinutes = 120) {
  const rows = await db.select().from(payments).where(eq(payments.status, "PENDING"));
  const cutoff = Date.now() - maxAgeMinutes * 60_000;
  for (const p of rows.filter((r) => r.createdAt.getTime() < cutoff)) await settlePayment(p.id, { status: "FAILED", reason: "Paiement non confirmé dans le délai imparti." });
}
