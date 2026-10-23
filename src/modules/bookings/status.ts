import { AppError } from "@/shared/errors";

// Machine à états des réservations (spec 1.3.1-F). Pure : testable sans base de données.
export const BOOKING_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "AWAITING_CONFIRMATION",
  "CONFIRMED",
  "MODIFIED",
  "CANCELLED",
  "REFUNDED",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "En attente de paiement",
  PAID: "Payée",
  AWAITING_CONFIRMATION: "En attente de confirmation",
  CONFIRMED: "Confirmée",
  MODIFIED: "Modifiée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

const TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["AWAITING_CONFIRMATION", "CONFIRMED", "CANCELLED", "REFUNDED"],
  AWAITING_CONFIRMATION: ["CONFIRMED", "CANCELLED", "REFUNDED"],
  CONFIRMED: ["MODIFIED", "CANCELLED", "REFUNDED"],
  MODIFIED: ["CONFIRMED", "CANCELLED", "REFUNDED"],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
};

export function isBookingStatus(v: string): v is BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(v);
}

export function allowedTransitions(from: BookingStatus): readonly BookingStatus[] {
  return TRANSITIONS[from];
}

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

const SEAT_RELEASING: readonly BookingStatus[] = ["CANCELLED", "REFUNDED"];

/** Les places sont rendues au stock quand on quitte un statut « actif » vers annulée/remboursée. */
export function releasesSeats(from: BookingStatus, to: BookingStatus): boolean {
  return SEAT_RELEASING.includes(to) && !SEAT_RELEASING.includes(from);
}

export function assertTransition(from: BookingStatus, to: BookingStatus): void {
  if (!canTransition(from, to)) {
    throw new AppError("CONFLICT", `Transition impossible : « ${STATUS_LABELS[from]} » → « ${STATUS_LABELS[to]} ».`);
  }
}
