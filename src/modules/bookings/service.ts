import { convertRounded, isCurrency, type Currency } from "@/shared/money";
import { cfg, cfgList, loadConfig } from "@/modules/settings/service";
import { and, eq, gt, lt, notExists } from "drizzle-orm";
import { bookings, db, passengers, payments, type Booking } from "@/db";
import { notFound as notFound404 } from "next/navigation";
import { AppError, conflict, forbidden, notFound, invalid } from "@/shared/errors";
import { env } from "@/shared/env";
import { notifyBooking } from "@/modules/notifications/service";
import type { BookingEmailKind } from "@/modules/notifications/templates";
import { getAdapter } from "./adapters";
import { createBookingSchema } from "./schemas";
import * as repo from "./repository";
import { assertTransition, releasesSeats, type BookingStatus, isBookingStatus } from "./status";

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans I, O, 0, 1
function newReference(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return "TA-" + Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("");
}

const EMAIL_FOR_STATUS: Partial<Record<BookingStatus, BookingEmailKind>> = {
  PAID: "PAYMENT_RECEIVED",
  CONFIRMED: "CONFIRMED",
  MODIFIED: "MODIFIED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
};

/** `opts.currency` : devise choisie par le client ; le prix unitaire est converti (même arrondi que l'affichage) et figé. */
export async function createBooking(userId: string, raw: unknown, opts: { currency?: Currency } = {}): Promise<Booking> {
  const input = createBookingSchema.parse(raw);
  const adapter = getAdapter(input.serviceType);

  const booking = await db.transaction(async (tx) => {
    let r = await adapter.reserve(tx, raw);
    if (opts.currency && isCurrency(r.currency) && r.currency !== opts.currency) r = { ...r, unitPrice: convertRounded(r.unitPrice, r.currency, opts.currency), currency: opts.currency };
    const createdId = crypto.randomUUID();
    await tx
      .insert(bookings)
      .values({
        id: createdId,
        reference: newReference(),
        userId,
        serviceType: adapter.type,
        itemId: r.itemId,
        title: r.title,
        subtitle: r.subtitle,
        startAt: r.startAt,
        endAt: r.endAt,
        details: JSON.stringify(r.details),
        conditions: r.conditions,
        cancellationPolicy: r.cancellationPolicy,
        quantity: r.quantity,
        multiplier: r.multiplier,
        unitPrice: r.unitPrice,
        total: r.unitPrice * r.quantity * r.multiplier,
        currency: r.currency,
      });
    await tx.insert(passengers).values(input.participants.map((fullName) => ({ bookingId: createdId, fullName })));
    const created = await tx.query.bookings.findFirst({ where: eq(bookings.id, createdId) });
    if (!created) throw new Error("Réservation introuvable après création.");
    return created;
  });

  await notifyBooking("PENDING_PAYMENT", booking.id);
  return booking;
}

/** Seul point d'entrée pour changer un statut : valide la transition, rend le stock, notifie. */
export async function changeStatus(bookingId: string, to: string, opts: { notify?: boolean } = {}) {
  if (!isBookingStatus(to)) throw invalid("Statut inconnu.");
  const updated = await db.transaction(async (tx) => {
    const current = await tx.query.bookings.findFirst({ where: eq(bookings.id, bookingId) });
    if (!current) throw notFound("Réservation introuvable.");
    const from = current.status as BookingStatus;
    assertTransition(from, to);
    await tx.update(bookings).set({ status: to }).where(eq(bookings.id, bookingId));
    if (releasesSeats(from, to)) await getAdapter(current.serviceType).release?.(tx, current);
    return tx.query.bookings.findFirst({ where: eq(bookings.id, bookingId) });
  });
  const kind = EMAIL_FOR_STATUS[to];
  if (kind && opts.notify !== false) await notifyBooking(kind, bookingId);
  return updated;
}

/** Réservation visible par son propriétaire ou par un administrateur. */
export async function getBookingFor(user: { id: string; role: string }, bookingId: string) {
  const booking = await repo.findWithRelations(bookingId);
  if (!booking) throw notFound("Réservation introuvable.");
  if (booking.userId !== user.id && user.role !== "ADMIN") throw forbidden("Cette réservation ne vous appartient pas.");
  return booking;
}

/** Variante pour les pages : toute erreur d'accès devient un 404 (n'indique pas si la réservation existe). */
export async function getBookingOrNotFound(user: { id: string; role: string }, bookingId: string) {
  try {
    return await getBookingFor(user, bookingId);
  } catch (e) {
    if (e instanceof AppError) notFound404();
    throw e;
  }
}

export async function cancelOwnPending(user: { id: string; role: string }, bookingId: string) {
  const booking = await getBookingFor(user, bookingId);
  if (booking.status !== "PENDING_PAYMENT") throw conflict("Seule une réservation non payée peut être annulée ici.");
  return changeStatus(bookingId, "CANCELLED");
}

/** Tâche planifiée : annule les réservations impayées au-delà du délai (rend les places). */
export async function expireStaleBookings(now = new Date()) {
  await loadConfig();
  const cutoff = new Date(now.getTime() - (Number(cfg("booking.pendingTtl")) || 30) * 60_000);
  const stale = await db
    .select({ id: bookings.id })
    .from(bookings)
    // Une réservation dont un paiement est en cours chez le prestataire n'est pas expirée.
    .where(and(eq(bookings.status, "PENDING_PAYMENT"), lt(bookings.createdAt, cutoff), notExists(db.select({ one: payments.id }).from(payments).where(and(eq(payments.bookingId, bookings.id), eq(payments.status, "PENDING"))))));
  for (const { id } of stale) await changeStatus(id, "CANCELLED");
  return stale.length;
}

/**
 * Tâche planifiée (à lancer toutes les 5 minutes pour des rappels « 30 minutes avant ») :
 * envoie, pour chaque réservation confirmée, le rappel dont l'échéance est atteinte (REMINDER_MINUTES).
 * Un seul e-mail par passage : si plusieurs échéances sont dépassées d'un coup, on envoie la plus proche du départ.
 */
export async function sendDueReminders(now = new Date()) {
  await loadConfig();
  const offsets = cfgList("booking.reminders").map(Number).filter((n) => Number.isFinite(n) && n > 0);
  const rows = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.status, "CONFIRMED"), gt(bookings.startAt, now)));
  let sent = 0;
  for (const b of rows) {
    const done = new Set(b.remindersSent.split(",").filter(Boolean).map(Number));
    const minutesLeft = (b.startAt.getTime() - now.getTime()) / 60_000;
    const due = offsets.filter((m) => !done.has(m) && minutesLeft <= m);
    if (due.length === 0) continue;
    await db.update(bookings).set({ remindersSent: [...done, ...due].join(",") }).where(eq(bookings.id, b.id));
    await notifyBooking("REMINDER", b.id, { minutes: Math.min(...due) });
    sent++;
  }
  return sent;
}

export const listBookingsForUser = repo.listForUser;
export const listAllBookings = repo.listAll;
export const getDashboardStats = repo.dashboardStats;
