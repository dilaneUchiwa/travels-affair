import type { Metadata } from "next";
import Link from "next/link";
import { BookingBadge, Card, Metric, PageTitle, TableWrap, Td, Th } from "@/components/admin/ui";
import { count, eq } from "drizzle-orm";
import { db, users } from "@/db";
import { getDashboardStats } from "@/modules/bookings/service";
import { isServiceType } from "@/modules/bookings/service-types";
import { offerCounts } from "@/modules/catalog/service";
import { formatMoney } from "@/shared/money";

export const metadata: Metadata = { title: "Tableau de bord" };
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = { FLIGHT: "Vols", HOTEL: "Hébergements", TRANSPORT: "Transports", CAR: "Locations", ACTIVITY: "Activités" };

/** Réservations créées par jour sur 14 jours (barres SVG, sans dépendance). */
function PerDayChart({ data }: { data: { day: string; count: number }[] }) {
  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() - (13 - i) * 86_400_000).toISOString().slice(0, 10));
  const counts = days.map((d) => Number(data.find((x) => x.day === d)?.count ?? 0));
  const max = Math.max(1, ...counts);
  const W = 560, H = 140, bw = W / 14;
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label="Réservations par jour sur 14 jours" className="h-auto w-full">
      {counts.map((c, i) => {
        const h = Math.round((c / max) * H);
        return (
          <g key={days[i]}>
            <rect x={i * bw + 6} y={H - h} width={bw - 12} height={Math.max(h, 2)} rx="3" className="fill-brand-500" opacity={c ? 1 : 0.2}>
              <title>{`${days[i]} : ${c}`}</title>
            </rect>
            {c > 0 && <text x={i * bw + bw / 2} y={H - h - 4} textAnchor="middle" className="fill-gray-500 text-[10px]">{c}</text>}
            <text x={i * bw + bw / 2} y={H + 16} textAnchor="middle" className="fill-gray-400 text-[9px]">{days[i].slice(8)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default async function AdminDashboard() {
  const [{ byStatus, byType, revenue, perDay }, offers, clientsRow] = await Promise.all([getDashboardStats(), offerCounts(), db.select({ n: count() }).from(users).where(eq(users.role, "CLIENT"))]);
  const clients = Number(clientsRow[0]?.n ?? 0);
  const total = byStatus.reduce((n, s) => n + Number(s.count), 0);
  const pending = Number(byStatus.find((s) => s.status === "PENDING_PAYMENT")?.count ?? 0);
  const toConfirm = Number(byStatus.find((s) => s.status === "PAID" || s.status === "AWAITING_CONFIRMATION")?.count ?? 0);
  return (
    <>
      <PageTitle title="Tableau de bord" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <Metric label="Réservations" value={total} />
        <Metric label="En attente de paiement" value={pending} />
        <Metric label="À confirmer" value={toConfirm} hint="payées, en attente de confirmation" />
        <Metric label="Clients" value={clients} hint="comptes clients inscrits" />
        {revenue.length === 0 ? <Metric label="Encaissé" value="0" /> : revenue.map((r) => <Metric key={r.currency} label={`Encaissé (${r.currency})`} value={formatMoney(Number(r.total), r.currency)} />)}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Réservations par jour (14 jours)"><PerDayChart data={perDay} /></Card>
        <Card title="Réservations par service">
          {byType.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucune réservation pour le moment.</p>
          ) : (
            <TableWrap>
              <thead><tr><Th>Service</Th><Th>Réservations</Th></tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {byType.filter((t) => isServiceType(t.type)).map((t) => (
                  <tr key={t.type}><Td><Link className="text-brand-500" href={`/admin/reservations?type=${t.type}`}>{TYPE_LABEL[t.type]}</Link></Td><Td>{Number(t.count)}</Td></tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Card>
        <Card title="Réservations par statut">
          {byStatus.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucune réservation pour le moment.</p>
          ) : (
            <TableWrap>
              <thead><tr><Th>Statut</Th><Th>Nombre</Th></tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {byStatus.map((s) => (
                  <tr key={s.status}><Td><Link href={`/admin/reservations?status=${s.status}`}><BookingBadge status={s.status} /></Link></Td><Td>{Number(s.count)}</Td></tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Card>
        <Card title="Offres publiées">
          <TableWrap>
            <thead><tr><Th>Ressource</Th><Th>Publiées / total</Th></tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {offers.map((o) => (
                <tr key={o.key}><Td><Link className="text-brand-500" href={`/admin/${o.key}`}>{o.title}</Link></Td><Td>{o.published} / {o.total}</Td></tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      </div>
    </>
  );
}
