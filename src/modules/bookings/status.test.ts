import { describe, expect, it } from "vitest";
import { allowedTransitions, canTransition, releasesSeats } from "./status";

describe("machine à états des réservations", () => {
  it("autorise payer ou annuler une réservation en attente de paiement", () => {
    expect(canTransition("PENDING_PAYMENT", "PAID")).toBe(true);
    expect(canTransition("PENDING_PAYMENT", "CANCELLED")).toBe(true);
  });
  it("interdit de confirmer sans paiement", () => {
    expect(canTransition("PENDING_PAYMENT", "CONFIRMED")).toBe(false);
  });
  it("REFUNDED est terminal", () => {
    expect(allowedTransitions("REFUNDED")).toHaveLength(0);
  });
  it("rend les places une seule fois", () => {
    expect(releasesSeats("PENDING_PAYMENT", "CANCELLED")).toBe(true);
    expect(releasesSeats("CONFIRMED", "REFUNDED")).toBe(true);
    expect(releasesSeats("CANCELLED", "REFUNDED")).toBe(false);
    expect(releasesSeats("PENDING_PAYMENT", "PAID")).toBe(false);
  });
});
