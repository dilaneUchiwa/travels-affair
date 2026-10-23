"use server";

import { redirect } from "next/navigation";
import { attempt, type FormState } from "@/shared/action";
import { requireUser } from "@/modules/auth/session";
import { getBookingFor } from "@/modules/bookings/service";
import { payBooking, refreshBookingPayments } from "./service";

export async function payAction(_: FormState, fd: FormData): Promise<FormState> {
  const bookingId = String(fd.get("bookingId") ?? "");
  const user = await requireUser();
  const result = await attempt(() => payBooking(user, bookingId, Object.fromEntries(fd)));
  if (!result.ok) return { error: result.error };
  if (result.data.paid) redirect(`/mon-compte/reservations/${bookingId}?paye=1`);
  // Redirection vers la page du prestataire (Stripe, PayPal) ou attente de confirmation sur le téléphone (Mobile Money).
  return { redirectTo: result.data.redirectUrl ?? `/reservation/${bookingId}/paiement?attente=1` };
}

/** Bouton « J'ai validé / vérifier mon paiement ». */
export async function checkPaymentAction(fd: FormData) {
  const bookingId = String(fd.get("bookingId") ?? "");
  const user = await requireUser();
  await attempt(async () => {
    await getBookingFor(user, bookingId); // contrôle de propriété
    await refreshBookingPayments(bookingId);
  });
  redirect(`/reservation/${bookingId}/paiement`);
}
