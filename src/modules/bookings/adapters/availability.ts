import { and, eq, lt, gt, notInArray, sql } from "drizzle-orm";
import { bookings, type Db, type Tx } from "@/db";
import { INACTIVE_STATUSES, type ServiceType } from "../service-types";

/** Unités déjà réservées d'une offre sur une période (hors réservations annulées/remboursées). */
export async function bookedUnits(tx: Tx | Db, type: ServiceType, itemId: string, from: Date, to: Date): Promise<number> {
  const [row] = await tx
    .select({ n: sql<number>`coalesce(sum(${bookings.quantity}), 0)` })
    .from(bookings)
    .where(
      and(
        eq(bookings.serviceType, type),
        eq(bookings.itemId, itemId),
        notInArray(bookings.status, [...INACTIVE_STATUSES]),
        lt(bookings.startAt, to), // chevauchement : début existant < fin demandée
        gt(bookings.endAt, from), //               et fin existante > début demandé
      ),
    );
  return Number(row?.n ?? 0);
}
