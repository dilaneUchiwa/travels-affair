import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { Badge, Card, Metric, PageTitle, Strong, TableWrap, Td, Th } from "@/components/admin/ui";
import { bookings, db, payments, users } from "@/db";
import { PAYMENT_METHODS } from "@/modules/settings/definitions";
import { formatDateTime } from "@/shared/dates";
import { formatMoney } from "@/shared/money";

export const metadata: Metadata = { title: "Paiements" };
export const dynamic = "force-dynamic";

const METHOD = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m.label]));
const statusBadge = (s: string) =>
  s === "SUCCEEDED" ? <Badge color="success">Réussi</Badge> : s === "FAILED" ? <Badge color="error">Échoué</Badge> : <Badge color="warning">En attente</Badge>;

export default async function AdminPayments() {
  const rows = await db
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

  const ok = rows.filter((r) => r.status === "SUCCEEDED");
  const pending = rows.filter((r) => r.status === "PENDING").length;
  const failed = rows.filter((r) => r.status === "FAILED").length;

  return (
    <>
      <PageTitle title="Paiements" />
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
