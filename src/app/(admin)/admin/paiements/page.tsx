import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { Badge, Card, Metric, PageTitle, Strong, TableWrap, Td, Th, btnOutline, btnPrimary, inputCls } from "@/components/admin/ui";
import { bookings, db, payments, users } from "@/db";
import { PAYMENT_METHODS } from "@/modules/settings/definitions";
import { formatDateTime } from "@/shared/dates";
import { formatMoney } from "@/shared/money";

export const metadata: Metadata = { title: "Paiements" };
export const dynamic = "force-dynamic";

const METHOD = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m.label]));
const statusBadge = (s: string) =>
  s === "SUCCEEDED" ? <Badge color="success">Réussi</Badge> : s === "FAILED" ? <Badge color="error">Échoué</Badge> : <Badge color="warning">En attente</Badge>;

const STATUSES = [["SUCCEEDED", "Réussi"], ["PENDING", "En attente"], ["FAILED", "Échoué"]];

export default async function AdminPayments({ searchParams }: { searchParams: { status?: string; method?: string; q?: string } }) {
  const fStatus = searchParams.status ?? "";
  const fMethod = searchParams.method ?? "";
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const all = await db
    .select({
      id: payments.id, method: payments.method, provider: payments.provider,
      amount: payments.amount, currency: payments.currency, status: payments.status,
      ref: payments.providerReference, reason: payments.failureReason, createdAt: payments.createdAt,
      bookingRef: bookings.reference, customer: users.name, email: users.email,
    })
    .from(payments)
    .leftJoin(bookings, eq(payments.bookingId, bookings.id))
    .leftJoin(users, eq(bookings.userId, users.id))
    .orderBy(desc(payments.createdAt));

  const rows = all.filter((r) =>
    (!fStatus || r.status === fStatus) &&
    (!fMethod || r.method === fMethod) &&
    (!q || [r.bookingRef, r.customer, r.email, r.ref].some((v) => (v ?? "").toLowerCase().includes(q))),
  );
  const ok = rows.filter((r) => r.status === "SUCCEEDED");
  const pending = rows.filter((r) => r.status === "PENDING").length;
  const failed = rows.filter((r) => r.status === "FAILED").length;

  return (
    <>
      <PageTitle title="Paiements">
        <a href="/api/admin/export/paiements" className={btnOutline}>Exporter CSV</a>
      </PageTitle>
      <form method="get" className="mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="flt-q" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Recherche</label>
          <input id="flt-q" name="q" defaultValue={searchParams.q ?? ""} placeholder="Réservation, client, e-mail…" className={`${inputCls} min-w-60`} />
        </div>
        <div>
          <label htmlFor="flt-status" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Statut</label>
          <select id="flt-status" name="status" defaultValue={fStatus} className={`${inputCls} min-w-44`}>
            <option value="">Tous</option>
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="flt-method" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Moyen</label>
          <select id="flt-method" name="method" defaultValue={fMethod} className={`${inputCls} min-w-44`}>
            <option value="">Tous</option>
            {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <button type="submit" className={btnPrimary}>Filtrer</button>
      </form>
      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Transactions" value={rows.length} />
        <Metric label="Réussies" value={ok.length} />
        <Metric label="En attente" value={pending} />
        <Metric label="Échouées" value={failed} />
      </div>
      <Card>
        <TableWrap>
          <thead><tr><Th>Date</Th><Th>Réservation</Th><Th>Client</Th><Th>Moyen</Th><Th>Montant</Th><Th>Statut</Th><Th>Référence</Th></tr></thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.length === 0 && <tr><Td>Aucun paiement.</Td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <Td>{formatDateTime(r.createdAt)}</Td>
                <Td><Strong>{r.bookingRef ?? "–"}</Strong></Td>
                <Td>{r.customer ?? "–"}<br /><span className="text-theme-xs text-gray-500">{r.email ?? ""}</span></Td>
                <Td>{METHOD[r.method] ?? r.method}<br /><span className="text-theme-xs text-gray-500">{r.provider}</span></Td>
                <Td>{formatMoney(r.amount, r.currency)}</Td>
                <Td>{statusBadge(r.status)}{r.reason ? <div className="text-theme-xs text-error-500">{r.reason}</div> : null}</Td>
                <Td><span className="text-theme-xs text-gray-500">{r.ref ?? "–"}</span></Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </>
  );
}
