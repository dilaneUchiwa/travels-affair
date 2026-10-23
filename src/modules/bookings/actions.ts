"use server";

import { getCurrency } from "@/shared/price";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { attempt, type FormState } from "@/shared/action";
import { requireAdmin, requireUser } from "@/modules/auth/session";
import { recordManualPayment } from "@/modules/payments/service";
import { notifyBooking } from "@/modules/notifications/service";
import type { BookingEmailKind } from "@/modules/notifications/templates";
import { cancelOwnPending, changeStatus, createBooking } from "./service";
import { OFFER_PATHS, isServiceType } from "./service-types";

const RESEND_KINDS: BookingEmailKind[] = ["PENDING_PAYMENT", "PAYMENT_RECEIVED", "CONFIRMED", "MODIFIED", "CANCELLED", "REFUNDED"];

export async function createBookingAction(_: FormState, fd: FormData): Promise<FormState> {
  const type = String(fd.get("serviceType") ?? "");
  const itemId = String(fd.get("itemId") ?? "");
  const user = await requireUser(isServiceType(type) ? `${OFFER_PATHS[type]}/${itemId}` : "/");
  const result = await attempt(() => createBooking(user.id, Object.fromEntries(fd), { currency: getCurrency() }));
  if (!result.ok) return { error: result.error };
  redirect(`/reservation/${result.data.id}/paiement`);
}

export async function cancelBookingAction(fd: FormData) {
  const user = await requireUser();
  await attempt(() => cancelOwnPending(user, String(fd.get("bookingId"))));
  revalidatePath("/mon-compte");
}

export async function adminChangeStatusAction(fd: FormData) {
  await requireAdmin();
  await attempt(() => changeStatus(String(fd.get("bookingId")), String(fd.get("status"))));
  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
}

/** Création d'une réservation par l'admin pour le compte d'un client (vente au comptoir / téléphone). */
export async function adminCreateBookingAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const userId = String(fd.get("userId") ?? "");
  if (!userId) return { error: "Sélectionnez un client." };
  const result = await attempt(() => createBooking(userId, Object.fromEntries(fd)));
  if (!result.ok) return { error: result.error };
  redirect(`/admin/reservations/${result.data.id}`);
}

/** Encaissement manuel d'une réservation en attente de paiement. */
export async function adminRecordPaymentAction(fd: FormData) {
  const admin = await requireAdmin();
  const bookingId = String(fd.get("bookingId") ?? "");
  await attempt(() => recordManualPayment(admin, bookingId, String(fd.get("method") ?? "")));
  revalidatePath(`/admin/reservations/${bookingId}`);
  revalidatePath("/admin/reservations");
  revalidatePath("/admin/paiements");
  revalidatePath("/admin");
}

/** Renvoie au client l'e-mail correspondant (avec les PDF en pièce jointe le cas échéant). */
export async function adminResendEmailAction(fd: FormData) {
  await requireAdmin();
  const bookingId = String(fd.get("bookingId") ?? "");
  const kind = String(fd.get("kind") ?? "");
  if (RESEND_KINDS.includes(kind as BookingEmailKind)) await attempt(() => notifyBooking(kind as BookingEmailKind, bookingId));
  revalidatePath(`/admin/reservations/${bookingId}`);
  revalidatePath("/admin/emails");
}
