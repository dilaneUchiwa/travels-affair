import "server-only";
import { and, asc, eq, gt, like, lt, gte, or, sql, type SQL } from "drizzle-orm";
import { activities, db, faqItems, hotelProperties, hotels, pages, transports, vehicles } from "@/db";
import { notFound } from "@/shared/errors";
import { dayAt } from "@/shared/dates";
import { bookedUnits } from "@/modules/bookings/adapters/availability";

const like_ = (col: Parameters<typeof like>[0], q?: string) => (q ? like(col, `%${q}%`) : undefined);
const dayRange = (day?: string) => {
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined;
  const start = dayAt(day, 0);
  return [start, new Date(start.getTime() + 86_400_000)] as const;
};
const all = (...c: (SQL | undefined)[]) => and(...c);

// ---------- Hébergements ----------
export async function searchHotels(f: { q?: string; stars?: string }) {
  const rows = await db.query.hotels.findMany({
    where: all(eq(hotels.status, "PUBLISHED"), f.q ? or(like_(hotels.city, f.q), like_(hotels.name, f.q), like_(hotels.country, f.q)) : undefined, f.stars && /^[1-5]$/.test(f.stars) ? eq(hotels.stars, Number(f.stars)) : undefined),
    with: { properties: true },
    orderBy: asc(hotels.name),
    limit: 60,
  });
  return rows
    .map((h) => ({ ...h, properties: h.properties.filter((p) => p.status === "PUBLISHED") }))
    .filter((h) => h.properties.length > 0)
    .map((h) => {
      const cheapest = [...h.properties].sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
      return { hotel: h, from: { price: cheapest.pricePerNight, currency: cheapest.currency } };
    });
}

export async function getHotel(id: string) {
  const h = await db.query.hotels.findFirst({ where: eq(hotels.id, id), with: { properties: true } });
  if (!h || h.status !== "PUBLISHED") throw notFound("Établissement introuvable.");
  return { ...h, properties: h.properties.filter((p) => p.status === "PUBLISHED") };
}

/** Unités encore libres d'un bien sur une période (null si dates invalides). */
export async function propertyFreeUnits(propertyId: string, checkIn?: string, checkOut?: string): Promise<number | null> {
  if (!checkIn || !checkOut || checkOut <= checkIn) return null;
  const [p] = await db.select().from(hotelProperties).where(eq(hotelProperties.id, propertyId));
  if (!p) return null;
  return Math.max(0, p.quantity - (await bookedUnits(db, "HOTEL", p.id, dayAt(checkIn, 14), dayAt(checkOut, 12))));
}

// ---------- Transports ----------
export const searchTransports = (f: { from?: string; to?: string; date?: string; mode?: string }) => {
  const r = dayRange(f.date);
  return db.query.transports.findMany({
    where: all(
      eq(transports.status, "PUBLISHED"), gt(transports.seatsAvailable, 0), gt(transports.departAt, new Date()),
      like_(transports.fromPlace, f.from), like_(transports.toPlace, f.to),
      f.mode && ["BUS", "TRAIN", "SHUTTLE"].includes(f.mode) ? eq(transports.mode, f.mode) : undefined,
      r ? and(gte(transports.departAt, r[0]), lt(transports.departAt, r[1])) : undefined,
    ),
    with: { provider: true },
    orderBy: asc(transports.departAt),
    limit: 60,
  });
};

export async function getTransport(id: string) {
  const t = await db.query.transports.findFirst({ where: eq(transports.id, id), with: { provider: true } });
  if (!t || t.status !== "PUBLISHED") throw notFound("Trajet introuvable.");
  return t;
}

// ---------- Locations ----------
export const searchVehicles = async (f: { location?: string; category?: string }) =>
  (await db.query.vehicles.findMany({ where: all(eq(vehicles.status, "PUBLISHED"), like_(vehicles.location, f.location)), with: { model: { with: { brand: true } }, category: true }, limit: 60 }))
    .filter((v) => !f.category || v.categoryId === f.category)
    .sort((a, b) => a.pricePerDay - b.pricePerDay);

export async function getVehicle(id: string) {
  const v = await db.query.vehicles.findFirst({ where: eq(vehicles.id, id), with: { model: { with: { brand: true } }, category: true } });
  if (!v || v.status !== "PUBLISHED") throw notFound("Véhicule introuvable.");
  return v;
}

export async function vehicleFreeUnits(id: string, pickup?: string, ret?: string): Promise<number | null> {
  if (!pickup || !ret || ret <= pickup) return null;
  const v = await db.query.vehicles.findFirst({ where: eq(vehicles.id, id) });
  if (!v) return null;
  return Math.max(0, v.units - (await bookedUnits(db, "CAR", id, dayAt(pickup, 9), dayAt(ret, 9))));
}

// ---------- Activités ----------
export const searchActivities = (f: { q?: string; date?: string }) => {
  const r = dayRange(f.date);
  return db.select().from(activities).where(all(
    eq(activities.status, "PUBLISHED"), gt(activities.placesAvailable, 0), gt(activities.startAt, new Date()),
    f.q ? or(like_(activities.title, f.q), like_(activities.city, f.q), like_(activities.country, f.q)) : undefined,
    r ? and(gte(activities.startAt, r[0]), lt(activities.startAt, r[1])) : undefined,
  )).orderBy(asc(activities.startAt)).limit(60);
};

export async function getActivity(id: string) {
  const [a] = await db.select().from(activities).where(eq(activities.id, id));
  if (!a || a.status !== "PUBLISHED") throw notFound("Activité introuvable.");
  return a;
}

// ---------- Contenus ----------
export const getPage = async (slug: string) => (await db.select().from(pages).where(eq(pages.slug, slug)))[0] ?? null;
export const listFaq = () => db.select().from(faqItems).orderBy(asc(faqItems.position));
