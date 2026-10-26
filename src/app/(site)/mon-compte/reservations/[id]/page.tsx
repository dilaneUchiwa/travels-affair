import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { PrintButton } from "@/components/PrintButton";
import { StatusBadge } from "@/components/StatusBadge";
import { getT } from "@/i18n/server";
import { requireUser } from "@/modules/auth/session";
import { getBookingOrNotFound } from "@/modules/bookings/service";
import { OFFER_PATHS, isServiceType } from "@/modules/bookings/service-types";
import { detailValue, parseDetails, priceBreakdown } from "@/modules/bookings/view";
import { DOCUMENT_KINDS } from "@/modules/documents/pdf";
import { bookingQrDataUrl } from "@/modules/documents/qr";
import { formatDateTime } from "@/shared/dates";
import { formatMoney } from "@/shared/money";

export const dynamic = "force-dynamic";
export function generateMetadata(): Metadata {
  return { title: getT().t("booking.title"), robots: { index: false } };
}

const TICKET_STATUSES = ["PAID", "AWAITING_CONFIRMATION", "CONFIRMED", "MODIFIED"];

export default async function BookingPage({ params, searchParams }: { params: { id: string }; searchParams: { paye?: string; attente?: string } }) {
  const { t, lang } = getT();
  const user = await requireUser();
  const b = await getBookingOrNotFound(user, params.id);
  const hasTicket = TICKET_STATUSES.includes(b.status);
  const qr = hasTicket ? await bookingQrDataUrl(b) : null;
  const paid = b.payments.find((p) => p.status === "SUCCEEDED");
  const pending = b.payments.find((p) => p.status === "PENDING");

  return (
    <main className="container section">
      <p className="no-print"><Link href="/mon-compte">← {t("account.bookings")}</Link></p>
      {searchParams.paye && <div className="alert success no-print">{t("booking.paidNotice")}</div>}
      {b.status === "PENDING_PAYMENT" && pending && <div className="alert info no-print">{t("booking.pendingProvider")} <Link href={`/reservation/${b.id}/paiement`}>{t("booking.checkPayment")}</Link></div>}
      {b.status === "PENDING_PAYMENT" && !pending && (
        <div className="alert info no-print">{t("booking.awaitingPay")} <Link href={`/reservation/${b.id}/paiement`}>{t("booking.payNow")}</Link></div>
      )}

      <div className="alert warn"><strong>{t("doc.notTicket")}.</strong> {t("doc.notTicketHint")}</div>

      <div className="ticket">
        <div className="ticket-head">
          <div><div style={{ opacity: .8, fontSize: ".85rem" }}>Travel&apos;s Affair · {t(`service.${b.serviceType}`)}</div><h1 style={{ color: "#fff", margin: 0 }}>{b.reference}</h1></div>
          <StatusBadge status={b.status} />
        </div>
        <div className="ticket-body">
          <div className="stack">
            <h2>{b.title}</h2>
            <p className="muted">{b.subtitle}</p>
            <dl className="kv">
              {parseDetails(b).map(([k, v]) => (<Fragment key={k}><dt>{t(`detail.${k}`)}</dt><dd>{detailValue(t, v)}</dd></Fragment>))}
            </dl>
            <h3>{t("doc.invoice")}</h3>
            <dl className="kv">
              <dt>{t("doc.invoiceNo")}</dt><dd>FAC-{b.reference}</dd>
              <dt>{t("booking.detail")}</dt><dd>{priceBreakdown(b, t, lang)}</dd>
              <dt>{t("mail.total")}</dt><dd><strong>{formatMoney(b.total, b.currency, lang)}</strong></dd>
              <dt>{t("doc.paymentStatus")}</dt><dd>{paid ? t("doc.paid", { date: formatDateTime(paid.createdAt, lang), method: t(`pay.method.${paid.method}`) }) : t("doc.unpaid")}</dd>
            </dl>
            {b.cancellationPolicy && <p className="muted"><strong>{t("common.cancellation")} :</strong> {b.cancellationPolicy}</p>}
          </div>
          <div className="ticket-qr">
            {qr ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt={`QR ${b.reference}`} />
                <p className="muted" style={{ fontSize: ".85rem" }}>{t("doc.presentQr")}</p>
              </>
            ) : (
              <p className="muted">{t("booking.afterPayment")}</p>
            )}
          </div>
        </div>
      </div>

      <div className="card no-print" style={{ marginTop: "1.25rem" }}>
        <h3>{t("booking.documents")}</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".6rem", marginTop: ".6rem" }}>
          {DOCUMENT_KINDS.filter((k) => k === "summary" || b.status !== "PENDING_PAYMENT").map((k) => (
            <a key={k} className="btn secondary small" href={`/api/documents/${b.id}/${k}`}>{t(`doc.${k}`)} · PDF</a>
          ))}
          {hasTicket && <PrintButton />}
        </div>
        {isServiceType(b.serviceType) && <p className="muted" style={{ marginTop: ".8rem" }}><Link href={OFFER_PATHS[b.serviceType]}>{t("booking.moreOffers")}</Link></p>}
      </div>
    </main>
  );
}
