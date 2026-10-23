import { and, eq, gte, sql } from "drizzle-orm";
import { activities, type Tx } from "@/db";
import { conflict, notFound } from "@/shared/errors";
import { formatDateTime } from "@/shared/dates";
import { createBookingSchema } from "../schemas";
import type { ServiceAdapter } from "../types";

export const activityAdapter: ServiceAdapter = {
  type: "ACTIVITY",
  async reserve(tx: Tx, raw) {
    const input = createBookingSchema.parse(raw);
    if (input.serviceType !== "ACTIVITY") throw new Error("type");
    const n = input.participants.length;
    const a = await tx.query.activities.findFirst({ where: eq(activities.id, input.itemId) });
    if (!a || a.status !== "PUBLISHED" || a.startAt <= new Date()) throw notFound("Cette activité n'est plus disponible.");
    const updated = await tx
      .update(activities)
      .set({ placesAvailable: sql`${activities.placesAvailable} - ${n}` })
      .where(and(eq(activities.id, a.id), gte(activities.placesAvailable, n)))
      .returning({ id: activities.id });
    if (updated.length === 0) throw conflict("Il ne reste pas assez de places pour cette activité.");
    return {
      itemId: a.id,
      title: a.title,
      subtitle: `${a.city}, ${a.country}`,
      startAt: a.startAt,
      endAt: new Date(a.startAt.getTime() + a.durationHours * 3_600_000),
      details: [
        ["place", `${a.city}, ${a.country}`],
        ["start", formatDateTime(a.startAt)],
        ["durationHours", `${a.durationHours} h`],
        ["participants", input.participants.join(", ")],
      ],
      conditions: a.conditions,
      cancellationPolicy: a.cancellationPolicy,
      quantity: n,
      multiplier: 1,
      unitPrice: a.price,
      currency: a.currency,
    };
  },
  async release(tx, booking) {
    await tx.update(activities).set({ placesAvailable: sql`${activities.placesAvailable} + ${booking.quantity}` }).where(eq(activities.id, booking.itemId));
  },
};
