import { layoverSummary } from "@/shared/layovers";
import { and, eq, gte, sql } from "drizzle-orm";
import { flights, type Tx } from "@/db";
import { conflict, notFound } from "@/shared/errors";
import { formatDateTime, formatDuration } from "@/shared/dates";
import { createBookingSchema } from "../schemas";
import type { ServiceAdapter } from "../types";

export const flightAdapter: ServiceAdapter = {
  type: "FLIGHT",
  async reserve(tx: Tx, raw) {
    const input = createBookingSchema.parse(raw);
    if (input.serviceType !== "FLIGHT") throw new Error("type");
    const seats = input.participants.length;
    const flight = await tx.query.flights.findFirst({ where: eq(flights.id, input.itemId) });
    if (!flight || flight.status !== "PUBLISHED" || flight.departAt <= new Date()) throw notFound("Ce vol n'est plus disponible.");
    // Décrément atomique : la condition WHERE empêche toute survente en cas de réservations simultanées.
    const [updated] = await tx
      .update(flights)
      .set({ seatsAvailable: sql`${flights.seatsAvailable} - ${seats}` })
      .where(and(eq(flights.id, flight.id), gte(flights.seatsAvailable, seats)));
    if (updated.affectedRows === 0) throw conflict("Il ne reste pas assez de places sur ce vol.");
    const details: [string, string][] = [
      ["company", flight.airline],
      ["departure", `${flight.fromCity} (${flight.fromAirport}) · ${formatDateTime(flight.departAt)}`],
      ["arrival", `${flight.toCity} (${flight.toAirport}) · ${formatDateTime(flight.arriveAt)}`],
      ["duration", formatDuration(flight.departAt, flight.arriveAt)],
      ["baggage", flight.baggage],
      ["participants", input.participants.join(", ")],
    ];
    if (flight.returnDepartAt && flight.returnArriveAt) details.splice(3, 0, ["returnFlight", `${formatDateTime(flight.returnDepartAt)} → ${formatDateTime(flight.returnArriveAt)}`]);
    if (flight.layovers.trim()) details.splice(4, 0, ["layovers", layoverSummary(flight.layovers)]);
    if (flight.itinerary.trim()) details.push(["itinerary", flight.itinerary.trim().split(/\r?\n/).join(" ; ")]);
    return {
      itemId: flight.id,
      title: `${flight.fromCity} → ${flight.toCity}`,
      subtitle: `${flight.airline} · ${flight.fromAirport} → ${flight.toAirport}`,
      startAt: flight.departAt,
      endAt: flight.returnArriveAt ?? flight.arriveAt,
      details,
      conditions: flight.conditions,
      cancellationPolicy: flight.cancellationPolicy,
      quantity: seats,
      multiplier: 1,
      unitPrice: flight.price,
      currency: flight.currency,
    };
  },
  async release(tx, booking) {
    await tx.update(flights).set({ seatsAvailable: sql`${flights.seatsAvailable} + ${booking.quantity}` }).where(eq(flights.id, booking.itemId));
  },
};
