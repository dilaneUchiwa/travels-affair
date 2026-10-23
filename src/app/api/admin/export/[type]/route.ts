import { NextResponse, type NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/modules/auth/session";
import { bookings, db, payments, users } from "@/db";
import { listAllBookings } from "@/modules/bookings/service";
import { STATUS_LABELS } from "@/modules/bookings/status";
import { PAYMENT_METHODS } from "@/modules/settings/definitions";
import { formatDateTime } from "@/shared/dates";

export const dynamic = "force-dynamic";

const SERVICE: Record<string, string> = { FLIGHT: "Vol", HOTEL: "Hébergement", TRANSPORT: "Transport", CAR: "Location", ACTIVITY: "Activité" };
const METHOD = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m.label]));
const label = (map: Record<string, string>, k: string) => map[k] ?? k;

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (headers: string[], rows: unknown[][]) =>
  "﻿" + [headers, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");

async function build(type: string): Promise<{ name: string; csv: string } | null> {
  if (type === "reservations") {
    const list = await listAllBookings();
    return {
      name: "reservations",
      csv: toCsv(
        ["Référence", "Date", "Client", "E-mail", "Service", "Titre", "Quantité", "Total", "Devise", "Statut"],
        list.map((b) => [b.reference, formatDateTime(b.createdAt), b.user.name, b.user.email, label(SERVICE, b.serviceType), b.title, b.quantity, b.total, b.currency, label(STATUS_LABELS as Record<string, string>, b.status)]),
      ),
    };
  }
  if (type === "paiements") {
    const rows = await db
      .select({ createdAt: payments.createdAt, bookingRef: bookings.reference, customer: users.name, email: users.email, method: payments.method, provider: payments.provider, amount: payments.amount, currency: payments.currency, status: payments.status, ref: payments.providerReference })
      .from(payments)
      .leftJoin(bookings, eq(payments.bookingId, bookings.id))
      .leftJoin(users, eq(bookings.userId, users.id))
      .orderBy(desc(payments.createdAt));
    return {
      name: "paiements",
      csv: toCsv(
        ["Date", "Réservation", "Client", "E-mail", "Moyen", "Fournisseur", "Montant", "Devise", "Statut", "Référence"],
        rows.map((r) => [formatDateTime(r.createdAt), r.bookingRef ?? "", r.customer ?? "", r.email ?? "", label(METHOD, r.method), r.provider, r.amount, r.currency, r.status, r.ref ?? ""]),
      ),
    };
  }
  if (type === "utilisateurs") {
    const rows = await db.select({ name: users.name, email: users.email, role: users.role, lang: users.lang, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt));
    return {
      name: "utilisateurs",
      csv: toCsv(["Nom", "E-mail", "Rôle", "Langue", "Inscrit le"], rows.map((u) => [u.name, u.email, u.role, u.lang, formatDateTime(u.createdAt)])),
    };
  }
  return null;
}

export async function GET(_: NextRequest, { params }: { params: { type: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 });
  const out = await build(params.type);
  if (!out) return new NextResponse("Type inconnu (reservations | paiements | utilisateurs)", { status: 404 });
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(out.csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${out.name}-${stamp}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
