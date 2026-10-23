import { eq } from "drizzle-orm";
import { hotelProperties, type Tx } from "@/db";
import { conflict, invalid, notFound } from "@/shared/errors";
import { dayAt, daysBetween, todayInDouala } from "@/shared/dates";
import { createBookingSchema } from "../schemas";
import type { ServiceAdapter } from "../types";
import { bookedUnits } from "./availability";

const MAX_NIGHTS = 60;

/** Arrivée à partir de 14 h, départ avant 12 h : deux séjours consécutifs ne se chevauchent pas. */
export const hotelAdapter: ServiceAdapter = {
  type: "HOTEL",
  async reserve(tx: Tx, raw) {
    const input = createBookingSchema.parse(raw);
    if (input.serviceType !== "HOTEL") throw new Error("type");
    const nights = daysBetween(input.checkIn, input.checkOut);
    if (input.checkIn < todayInDouala()) throw invalid("La date d'arrivée est passée.");
    if (nights < 1) throw invalid("Le départ doit être après l'arrivée.");
    if (nights > MAX_NIGHTS) throw invalid(`Séjour limité à ${MAX_NIGHTS} nuits.`);

    const prop = await tx.query.hotelProperties.findFirst({ where: eq(hotelProperties.id, input.itemId), with: { hotel: true } });
    if (!prop || prop.status !== "PUBLISHED" || prop.hotel.status !== "PUBLISHED") throw notFound("Ce bien n'est plus disponible.");
    if (input.participants.length > prop.capacity * input.units) throw invalid(`Capacité maximale : ${prop.capacity * input.units} personne(s).`);

    const from = dayAt(input.checkIn, 14);
    const to = dayAt(input.checkOut, 12);
    const taken = await bookedUnits(tx, "HOTEL", prop.id, from, to);
    if (taken + input.units > prop.quantity) throw conflict("Ce bien n'est plus disponible aux dates demandées.");

    const h = prop.hotel;
    return {
      itemId: prop.id,
      title: `${h.name} — ${prop.name}`,
      subtitle: `${"★".repeat(h.stars)} · ${h.city}, ${h.country}`,
      startAt: from,
      endAt: to,
      details: [
        ["address", [h.address, h.city, h.country].filter(Boolean).join(", ")],
        ["checkIn", `${input.checkIn} (14:00)`],
        ["checkOut", `${input.checkOut} (12:00)`],
        ["nights", String(nights)],
        ["units", String(input.units)],
        ["participants", input.participants.join(", ")],
      ],
      conditions: h.conditions,
      cancellationPolicy: h.cancellationPolicy,
      quantity: input.units,
      multiplier: nights,
      unitPrice: prop.pricePerNight,
      currency: prop.currency,
    };
  },
};
