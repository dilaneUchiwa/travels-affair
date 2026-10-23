import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge, BookingBadge, Card, PageTitle, Strong, TableWrap, Td, Th, btnOutline, btnPrimary, inputCls } from "@/components/admin/ui";
import { getT } from "@/i18n/server";
import { requireAdmin } from "@/modules/auth/session";
import { adminChangeStatusAction } from "@/modules/bookings/actions";
import { getBookingFor } from "@/modules/bookings/service";
import { allowedTransitions, STATUS_LABELS } from "@/modules/bookings/status";
import { parseDetails, detailValue, priceBreakdown } from "@/modules/bookings/view";
import { DOCUMENT_KINDS } from "@/modules/documents/pdf";
import { bookingQrDataUrl } from "@/modules/documents/qr";
import { PAYMENT_METHODS } from "@/modules/settings/definitions";
import { formatDateTime } from "@/shared/dates";
import { formatMoney } from "@/shared/money";

export const metadata: Metadata = { title: "Détail réservation" };
export const dynamic = "force-dynamic";

const METHOD = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m.label]));
const TICKET_STATUSES = ["PAID", "AWAITING_CONFIRMATION", "CONFIRMED", "MODIFIED"];
const DOC_LABEL: Record<string, string> = { confirmation: "Confirmation", summary: "Récapitulatif", invoice: "Facture", voucher: "Bon d'échange" };
const payBadge = (s: string) => (s === "SUCCEEDED" ? <Badge color="success">Réussi</Badge> : s === "FAILED" ? <Badge color="error">Échoué</Badge> : <Badge color="warning">En attente</Badge>);

export default async function AdminBookingDetail({ params }: { params: { id: string } }) {
  const { t, lang } = getT();
  const admin = await requireAdmin();
  const b = await getBookingFor(admin, params.id);
  const next = allowedTransitions(b.status as Parameters<typeof allowedTransitions>[0]);
  const qr = TICKET_STATUSES.includes(b.status) ? await bookingQrDataUrl(b) : null;

  return (
    <>
      <p className="mb-4"><Link className="text-brand-500" href="/admin/reservations">← Réservations</Link></p>
      <PageTitle title={`Réservation ${b.reference}`}>
        <BookingBadge status={b.status} />
      </PageTitle>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 flex flex-col gap-6">
          <Card title={b.title}>
            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{b.subtitle}</p>
            <dl className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-2 text-sm">
              {parseDetails(b).map(([k, v]) => (
                <Fragment key={k}>
                  <dt className="text-gray-500 dark:text-gray-400">{t(`detail.${k}`)}</dt>
                  <dd className="text-gray-800 dark:text-white/90">{detailValue(t, v)}</dd>
                </Fragment>
              ))}
            </dl>
          </Card>

          <Card title="Facturation">
            <dl className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-gray-500 dark:text-gray-400">N° facture</dt><dd className="text-gray-800 dark:text-white/90">FAC-{b.reference}</dd>
              <dt className="text-gray-500 dark:text-gray-400">Détail</dt><dd className="text-gray-800 dark:text-white/90">{priceBreakdown(b, t, lang)}</dd>
              <dt className="text-gray-500 dark:text-gray-400">Total</dt><dd><Strong>{formatMoney(b.total, b.currency)}</Strong></dd>
            </dl>
          </Card>

          <Card title="Paiements">
            <TableWrap>
              <thead><tr><Th>Date</Th><Th>Moyen</Th><Th>Montant</Th><Th>Statut</Th><Th>Référence</Th></tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {b.payments.length === 0 && <tr><Td>Aucun paiement.</Td></tr>}
                {b.payments.map((p) => (
                  <tr key={p.id}>
                    <Td>{formatDateTime(p.createdAt)}</Td>
                    <Td>{METHOD[p.method] ?? p.method}<br /><span className="text-theme-xs text-gray-500">{p.provider}</span></Td>
                    <Td>{formatMoney(p.amount, p.currency)}</Td>
                    <Td>{payBadge(p.status)}{p.failureReason ? <div className="text-theme-xs text-error-500">{p.failureReason}</div> : null}</Td>
                    <Td><span className="text-theme-xs text-gray-500">{p.providerReference ?? "–"}</span></Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Card>

          {b.passengers.length > 0 && (
            <Card title="Voyageurs">
              <ul className="list-disc pl-5 text-sm text-gray-800 dark:text-white/90">
                {b.passengers.map((p) => <li key={p.id}>{p.fullName}</li>)}
              </ul>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Client">
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-500 dark:text-gray-400">Nom</dt><dd className="text-gray-800 dark:text-white/90">{b.user.name}</dd>
              <dt className="text-gray-500 dark:text-gray-400">E-mail</dt><dd className="text-gray-800 dark:text-white/90">{b.user.email}</dd>
              <dt className="text-gray-500 dark:text-gray-400">Créée le</dt><dd className="text-gray-800 dark:text-white/90">{formatDateTime(b.createdAt)}</dd>
            </dl>
          </Card>

          <Card title="Statut">
            {next.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Aucune transition possible.</p>
            ) : (
              <form action={adminChangeStatusAction} className="flex items-center gap-2">
                <input type="hidden" name="bookingId" value={b.id} />
                <select name="status" aria-label="Nouveau statut" className={`${inputCls} min-w-44`}>
                  {next.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                <button type="submit" className={btnPrimary}>Appliquer</button>
              </form>
            )}
          </Card>

          {qr && (
            <Card title="QR code de vérification">
              <Image src={qr} alt={`QR ${b.reference}`} width={180} height={180} unoptimized className="mx-auto" />
              <p className="mt-2 text-center text-theme-xs text-gray-500">Scan → page de vérification publique.</p>
            </Card>
          )}

          <Card title="Documents">
            <div className="flex flex-col gap-2">
              {DOCUMENT_KINDS.filter((k) => k === "summary" || b.status !== "PENDING_PAYMENT").map((k) => (
                <a key={k} href={`/api/documents/${b.id}/${k}`} target="_blank" rel="noopener" className={btnOutline}>{DOC_LABEL[k]} (PDF)</a>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
