import { and, desc, eq, sql } from "drizzle-orm";
import { bookings, db } from "@/db";

const withAll = { user: true, passengers: true, payments: true } as const;

export const findWithRelations = (id: string) =>
  db.query.bookings.findFirst({ where: eq(bookings.id, id), with: withAll });

export const listForUser = (userId: string) =>
  db.query.bookings.findMany({ where: eq(bookings.userId, userId), orderBy: desc(bookings.createdAt), with: { passengers: true } });

export const listAll = (filters: { status?: string; type?: string } = {}) =>
  db.query.bookings.findMany({
    where: and(filters.status ? eq(bookings.status, filters.status) : undefined, filters.type ? eq(bookings.serviceType, filters.type) : undefined),
    orderBy: desc(bookings.createdAt),
    with: withAll,
    limit: 300,
  });

const ACTIVE = sql`${bookings.status} in ('PAID','AWAITING_CONFIRMATION','CONFIRMED','MODIFIED')`;

/** Indicateurs du tableau de bord admin. */
export async function dashboardStats() {
  const byStatus = await db.select({ status: bookings.status, count: sql<number>`count(*)` }).from(bookings).groupBy(bookings.status);
  const byType = await db
    .select({ type: bookings.serviceType, count: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(case when ${ACTIVE} then ${bookings.total} else 0 end), 0)` })
    .from(bookings)
    .groupBy(bookings.serviceType);
  const revenue = await db
    .select({ currency: bookings.currency, total: sql<number>`coalesce(sum(${bookings.total}), 0)` })
    .from(bookings)
    .where(ACTIVE)
    .groupBy(bookings.currency);
  const perDay = await db
    .select({ day: sql<string>`date(${bookings.createdAt}, 'unixepoch')`, count: sql<number>`count(*)` })
    .from(bookings)
    .where(sql`${bookings.createdAt} >= unixepoch() - 13 * 86400`)
    .groupBy(sql`date(${bookings.createdAt}, 'unixepoch')`);
  return { byStatus, byType, revenue, perDay };
}
