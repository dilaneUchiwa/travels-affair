import { and, asc, eq, gt, gte, like, lt, or, type SQL } from "drizzle-orm";
import { airlines, db, flights, type Flight } from "@/db";
import { inArray } from "drizzle-orm";
import { parsePhotos } from "@/modules/uploads/service";
import type { FlightSearch } from "./schemas";

export function searchPublished(filters: FlightSearch) {
  const conditions: (SQL | undefined)[] = [
    eq(flights.status, "PUBLISHED"),
    gt(flights.seatsAvailable, 0),
    gt(flights.departAt, new Date()),
  ];
  if (filters.from) {
    const q = `%${filters.from}%`;
    conditions.push(or(like(flights.fromCity, q), like(flights.fromAirport, q)));
  }
  if (filters.to) {
    const q = `%${filters.to}%`;
    conditions.push(or(like(flights.toCity, q), like(flights.toAirport, q)));
  }
  if (filters.date) {
    const start = new Date(`${filters.date}T00:00:00.000Z`);
    conditions.push(gte(flights.departAt, start), lt(flights.departAt, new Date(start.getTime() + 86_400_000)));
  }
  return db.select().from(flights).where(and(...conditions)).orderBy(asc(flights.departAt)).limit(50);
}

export const findById = (id: string) => db.query.flights.findFirst({ where: eq(flights.id, id) });

export const featured = (limit = 6) =>
  db
    .select()
    .from(flights)
    .where(and(eq(flights.status, "PUBLISHED"), gt(flights.seatsAvailable, 0), gt(flights.departAt, new Date())))
    .orderBy(asc(flights.departAt))
    .limit(limit);

export type FlightView = Flight & { airlineLogo: string | null; airlineCode: string };

/** Ajoute le logo et le code IATA de la compagnie (une seule requête pour toute la liste). */
export async function withAirlines(list: Flight[]): Promise<FlightView[]> {
  const ids = [...new Set(list.map((f) => f.airlineId).filter((x): x is string => !!x))];
  const rows = ids.length ? await db.select().from(airlines).where(inArray(airlines.id, ids)) : [];
  const byId = new Map(rows.map((a) => [a.id, a]));
  return list.map((f) => {
    const a = f.airlineId ? byId.get(f.airlineId) : undefined;
    return { ...f, airlineLogo: a ? parsePhotos(a.logo)[0] ?? null : null, airlineCode: a?.code ?? "" };
  });
}
