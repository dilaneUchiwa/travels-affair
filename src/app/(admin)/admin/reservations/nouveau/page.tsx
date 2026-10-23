import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, eq, gt } from "drizzle-orm";
import { PageTitle } from "@/components/admin/ui";
import { AdminBookingForm } from "@/components/admin/BookingForm";
import { activities, db, flights, hotelProperties, transports, users, vehicles } from "@/db";
import { formatDate } from "@/shared/dates";
import { requireAdmin } from "@/modules/auth/session";

export const metadata: Metadata = { title: "Nouvelle réservation" };
export const dynamic = "force-dynamic";

export default async function AdminNewBooking() {
  await requireAdmin();
  const now = new Date();

  const [clients, fl, tr, ac, biens, veh] = await Promise.all([
    db.select({ id: users.id, name: users.name, email: users.email }).from(users).orderBy(asc(users.name)),
    db.select({ id: flights.id, fromCity: flights.fromCity, toCity: flights.toCity, departAt: flights.departAt }).from(flights).where(and(eq(flights.status, "PUBLISHED"), gt(flights.departAt, now))).orderBy(asc(flights.departAt)),
    db.select({ id: transports.id, fromPlace: transports.fromPlace, toPlace: transports.toPlace, departAt: transports.departAt }).from(transports).where(and(eq(transports.status, "PUBLISHED"), gt(transports.departAt, now))).orderBy(asc(transports.departAt)),
    db.select({ id: activities.id, title: activities.title, city: activities.city, startAt: activities.startAt }).from(activities).where(and(eq(activities.status, "PUBLISHED"), gt(activities.startAt, now))).orderBy(asc(activities.startAt)),
    db.query.hotelProperties.findMany({ where: eq(hotelProperties.status, "PUBLISHED"), with: { hotel: true } }),
    db.query.vehicles.findMany({ where: eq(vehicles.status, "PUBLISHED"), with: { model: { with: { brand: true } }, category: true } }),
  ]);

  const offers: Record<string, { id: string; label: string }[]> = {
    FLIGHT: fl.map((f) => ({ id: f.id, label: `${f.fromCity} → ${f.toCity} · ${formatDate(f.departAt)}` })),
    TRANSPORT: tr.map((t) => ({ id: t.id, label: `${t.fromPlace} → ${t.toPlace} · ${formatDate(t.departAt)}` })),
    ACTIVITY: ac.map((a) => ({ id: a.id, label: `${a.title} · ${a.city}` })),
    HOTEL: biens.filter((p) => p.hotel.status === "PUBLISHED").map((p) => ({ id: p.id, label: `${p.hotel.name} · ${p.name} (${p.hotel.city})` })),
    CAR: veh.map((v) => ({ id: v.id, label: `${v.model.brand.name} ${v.model.name} · ${v.location}` })),
  };

  return (
    <>
      <p className="mb-4"><Link className="text-brand-500" href="/admin/reservations">← Réservations</Link></p>
      <PageTitle title="Nouvelle réservation" />
      <AdminBookingForm users={clients} offers={offers} />
    </>
  );
}
