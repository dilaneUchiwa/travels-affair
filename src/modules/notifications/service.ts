import { eq } from "drizzle-orm";
import { db, emailLogs } from "@/db";
import { renderBookingPdf } from "@/modules/documents/pdf";
import { bookingQrPayload } from "@/modules/documents/qr";
import { getMailer, type MailAttachment, type MailMessage } from "./mailer";
import { renderBookingEmail, type BookingEmailKind } from "./templates";

/** Envoie ET journalise. Une panne d'envoi ne doit jamais faire échouer une réservation ou un paiement. */
export async function deliver(message: MailMessage, bookingId?: string) {
  let error: string | undefined;
  try {
    await getMailer().send(message);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error("[notifications] échec d'envoi", error);
  }
  await db.insert(emailLogs).values({
    bookingId,
    to: message.to,
    subject: message.subject,
    body: message.text + (message.attachments?.length ? `\n\n[PJ : ${message.attachments.map((a) => a.filename).join(", ")}]` : ""),
    delivered: !error,
    error,
  });
}

export async function notifyBooking(kind: BookingEmailKind, bookingId: string, opts: { minutes?: number } = {}) {
  const booking = await db.query.bookings.findFirst({
    where: (b) => eq(b.id, bookingId),
    with: { user: true, passengers: true, payments: true },
  });
  if (!booking) return;
  const lang = booking.user.lang === "en" ? "en" : "fr";
  const attachments: MailAttachment[] = [];
  try {
    // Confirmation de paiement : facture ; confirmation de réservation : confirmation + document de réservation.
    const kinds = kind === "PAYMENT_RECEIVED" ? (["invoice"] as const) : kind === "CONFIRMED" ? (["confirmation", "voucher"] as const) : [];
    for (const k of kinds) {
      attachments.push({
        filename: `${k}-${booking.reference}.pdf`,
        contentType: "application/pdf",
        content: await renderBookingPdf(k, booking, lang, bookingQrPayload(booking)),
      });
    }
  } catch (e) {
    console.error("[notifications] PDF non joint", e); // l'e-mail part quand même
  }
  await deliver({ to: booking.user.email, ...renderBookingEmail(kind, booking, opts), attachments }, booking.id);
}

export const listEmailLogs = (limit = 100) => db.query.emailLogs.findMany({ orderBy: (e, { desc }) => desc(e.createdAt), limit });
