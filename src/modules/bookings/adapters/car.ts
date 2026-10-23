import { eq } from "drizzle-orm";
import { vehicles, type Tx } from "@/db";
import { conflict, invalid, notFound } from "@/shared/errors";
import { dayAt, daysBetween, todayInDouala } from "@/shared/dates";
import { createBookingSchema } from "../schemas";
import type { ServiceAdapter } from "../types";
import { bookedUnits } from "./availability";

const MAX_DAYS = 60;

/** Prise en charge et restitution à 09 h : jour entamé = jour facturé, locations consécutives possibles. */
export const carAdapter: ServiceAdapter = {
  type: "CAR",
  async reserve(tx: Tx, raw) {
    const input = createBookingSchema.parse(raw);
    if (input.serviceType !== "CAR") throw new Error("type");
    const days = daysBetween(input.pickupDate, input.returnDate);
    if (input.pickupDate < todayInDouala()) throw invalid("La date de prise en charge est passée.");
    if (days < 1) throw invalid("La restitution doit être après la prise en charge.");
    if (days > MAX_DAYS) throw invalid(`Location limitée à ${MAX_DAYS} jours.`);

    const v = await tx.query.vehicles.findFirst({
      where: eq(vehicles.id, input.itemId),
      with: { model: { with: { brand: true } }, category: true },
    });
    if (!v || v.status !== "PUBLISHED") throw notFound("Ce véhicule n'est plus disponible.");

    const from = dayAt(input.pickupDate, 9);
    const to = dayAt(input.returnDate, 9);
    const taken = await bookedUnits(tx, "CAR", v.id, from, to);
    if (taken + input.units > v.units) throw conflict("Ce véhicule n'est plus disponible aux dates demandées.");

    const name = `${v.model.brand.name} ${v.model.name}`;
    return {
      itemId: v.id,
      title: name,
      subtitle: `${v.category.name} · ${v.location}`,
      startAt: from,
      endAt: to,
      details: [
        ["vehicle", name],
        ["category", v.category.name],
        ["pickup", `${v.location} · ${input.pickupDate} (09:00)`],
        ["return", `${input.returnDate} (09:00)`],
        ["days", String(days)],
        ["units", String(input.units)],
        ["mainDriver", input.participants.join(", ")],
      ],
      conditions: v.conditions,
      cancellationPolicy: "",
      quantity: input.units,
      multiplier: days,
      unitPrice: v.pricePerDay,
      currency: v.currency,
    };
  },
};
