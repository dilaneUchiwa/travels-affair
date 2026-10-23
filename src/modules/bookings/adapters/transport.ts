import { and, eq, gte, sql } from "drizzle-orm";
import { transports, type Tx } from "@/db";
import { conflict, notFound } from "@/shared/errors";
import { formatDateTime } from "@/shared/dates";
import { createBookingSchema } from "../schemas";
import type { ServiceAdapter } from "../types";

export const transportAdapter: ServiceAdapter = {
  type: "TRANSPORT",
  async reserve(tx: Tx, raw) {
    const input = createBookingSchema.parse(raw);
    if (input.serviceType !== "TRANSPORT") throw new Error("type");
    const seats = input.participants.length;
    const t = await tx.query.transports.findFirst({ where: eq(transports.id, input.itemId), with: { provider: true } });
    if (!t || t.status !== "PUBLISHED" || t.departAt <= new Date()) throw notFound("Ce transport n'est plus disponible.");
    const [updated] = await tx
      .update(transports)
      .set({ seatsAvailable: sql`${transports.seatsAvailable} - ${seats}` })
      .where(and(eq(transports.id, t.id), gte(transports.seatsAvailable, seats)));
    if (updated.affectedRows === 0) throw conflict("Il ne reste pas assez de places sur ce trajet.");
    const details: [string, string][] = [
      ["provider", t.provider.name],
      ["mode", t.mode],
      ["departure", `${t.fromPlace} · ${formatDateTime(t.departAt)}`],
      ["arrival", `${t.toPlace} · ${formatDateTime(t.arriveAt)}`],
      ["participants", input.participants.join(", ")],
    ];
    if (t.driverName) details.push(["driver", t.driverName]);
    if (t.accessConditions) details.push(["access", t.accessConditions]);
    return {
      itemId: t.id,
      title: `${t.fromPlace} → ${t.toPlace}`,
      subtitle: t.provider.name,
      startAt: t.departAt,
      endAt: t.arriveAt,
      details,
      conditions: t.accessConditions,
      cancellationPolicy: "",
      quantity: seats,
      multiplier: 1,
      unitPrice: t.price,
      currency: t.currency,
    };
  },
  async release(tx, booking) {
    await tx.update(transports).set({ seatsAvailable: sql`${transports.seatsAvailable} + ${booking.quantity}` }).where(eq(transports.id, booking.itemId));
  },
};
