import type { Metadata } from "next";
import Link from "next/link";
import { BookingBadge, Card, PageTitle, Strong, TableWrap, Td, Th, btnOutline, btnPrimary, inputCls } from "@/components/admin/ui";
import { adminChangeStatusAction } from "@/modules/bookings/actions";
import { listAllBookings } from "@/modules/bookings/service";
import { BOOKING_STATUSES, STATUS_LABELS, allowedTransitions, isBookingStatus } from "@/modules/bookings/status";
import { formatDateTime } from "@/shared/dates";
import { formatMoney } from "@/shared/money";

export const metadata: Metadata = { title: "Réservations" };
export const dynamic = "force-dynamic";

function StatusForm({ id, next }: { id: string; next: ReturnType<typeof allowedTransitions> }) {
  if (next.length === 0) return <>–</>;
  return (
    <form action={adminChangeStatusAction} className="flex items-center gap-2">
      <input type="hidden" name="bookingId" value={id} />
      <select name="status" aria-label="Nouveau statut" className={`${inputCls} min-w-44`}>
        {next.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>
      <button type="submit" className={btnPrimary}>OK</button>
    </form>
  );
}

const SERVICE: Record<string, string> = { FLIGHT: "Vol", HOTEL: "Hébergement", TRANSPORT: "Transport", CAR: "Location", ACTIVITY: "Activité" };

export default async function AdminBookings({ searchParams }: { searchParams: { status?: string; type?: string; q?: string } }) {
  const status = searchParams.status && isBookingStatus(searchParams.status) ? searchParams.status : undefined;
  const type = searchParams.type && SERVICE[searchParams.type] ? searchParams.type : undefined;
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const all = await listAllBookings({ status, type });
  const bookings = q ? all.filter((b) => [b.reference, b.user.name, b.user.email, b.title].some((v) => v.toLowerCase().includes(q))) : all;
  return (
    <>
      <PageTitle title="Réservations">
        <Link href="/admin/reservations/nouveau" className={btnPrimary}>Nouvelle réservation</Link>
        <a href="/api/admin/export/reservations" className={btnOutline}>Exporter CSV</a>
      </PageTitle>
      <form method="get" className="mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="flt-q" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Recherche</label>
          <input id="flt-q" name="q" defaultValue={searchParams.q ?? ""} placeholder="Référence, client, e-mail…" className={`${inputCls} min-w-60`} />
        </div>
        <div>
          <label htmlFor="flt-status" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Statut</label>
          <select id="flt-status" name="status" defaultValue={status ?? ""} className={`${inputCls} min-w-52`}>
            <option value="">Tous</option>
            {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="flt-type" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Service</label>
          <select id="flt-type" name="type" defaultValue={type ?? ""} className={`${inputCls} min-w-44`}>
            <option value="">Tous</option>
            {Object.entries(SERVICE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button type="submit" className={btnPrimary}>Filtrer</button>
      </form>
      <div className="space-y-3 md:hidden">
        {bookings.length === 0 && <Card><p className="p-5 text-theme-sm text-gray-500">Aucune réservation.</p></Card>}
        {bookings.map((b) => {
          const next = isBookingStatus(b.status) ? allowedTransitions(b.status) : [];
          return (
            <Card key={b.id}>
              <div className="space-y-2 p-4 text-theme-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/admin/reservations/${b.id}`} className="font-semibold text-brand-500">{b.reference}</Link>
                  <BookingBadge status={b.status} />
                </div>
                <p>{b.user.name} · {b.user.email}</p>
                <p><span className="font-medium text-gray-800 dark:text-white/90">{b.title}</span> · {SERVICE[b.serviceType] ?? b.serviceType} · {b.quantity}</p>
                <p>{formatMoney(b.total, b.currency)} · {formatDateTime(b.createdAt)}</p>
                <div className="pt-1"><StatusForm id={b.id} next={next} /></div>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="hidden md:block">
      <Card>
        <TableWrap>
          <thead><tr><Th>Référence</Th><Th>Client</Th><Th>Vol</Th><Th>Total</Th><Th>Statut</Th><Th>Changer le statut</Th></tr></thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {bookings.length === 0 && <tr><Td>Aucune réservation.</Td></tr>}
            {bookings.map((b) => {
              const next = isBookingStatus(b.status) ? allowedTransitions(b.status) : [];
              return (
                <tr key={b.id}>
                  <Td><Link href={`/admin/reservations/${b.id}`} className="font-semibold text-brand-500">{b.reference}</Link><br />{formatDateTime(b.createdAt)}</Td>
                  <Td><Strong>{b.user.name}</Strong>{b.user.email}</Td>
                  <Td><Strong>{b.title}</Strong>{SERVICE[b.serviceType] ?? b.serviceType} · {b.quantity}</Td>
                  <Td>{formatMoney(b.total, b.currency)}</Td>
                  <Td><BookingBadge status={b.status} /></Td>
                  <Td>
                    <StatusForm id={b.id} next={next} />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </Card>
      </div>
    </>
  );
}
