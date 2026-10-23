import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { getT } from "@/i18n/server";
import { requireUser } from "@/modules/auth/session";
import { getBookingOrNotFound } from "@/modules/bookings/service";
import { priceBreakdown } from "@/modules/bookings/view";
import { checkPaymentAction } from "@/modules/payments/actions";
import { PayForm } from "@/modules/payments/PayForm";
import { providerInfo } from "@/modules/payments/registry";
import { PAYMENT_METHODS, type PaymentMethod } from "@/modules/payments/schemas";
import { enabledPaymentMethods, loadConfig } from "@/modules/settings/service";
import { refreshBookingPayments } from "@/modules/payments/service";
import { formatDateTime } from "@/shared/dates";
import { formatMoney } from "@/shared/money";
import { price } from "@/shared/price";

export const dynamic = "force-dynamic";
export function generateMetadata(): Metadata {
  return { title: getT().t("pay.title"), robots: { index: false } };
}

export default async function PaymentPage({ params, searchParams }: { params: { id: string }; searchParams: { annule?: string; echec?: string; attente?: string } }) {
  const { t, lang } = getT();
  await loadConfig();
  const user = await requireUser();
  let booking = await getBookingOrNotFound(user, params.id);
  if (booking.payments.some((p) => p.status === "PENDING")) {
    await refreshBookingPayments(booking.id); // l'opérateur a peut-être déjà répondu
    booking = await getBookingOrNotFound(user, params.id);
  }
  if (booking.status !== "PENDING_PAYMENT") redirect(`/mon-compte/reservations/${booking.id}${booking.payments.some((p) => p.status === "SUCCEEDED") ? "?paye=1" : ""}`);
  const pending = booking.payments.find((p) => p.status === "PENDING");
  const simulated = Object.fromEntries(PAYMENT_METHODS.map((m) => [m, providerInfo(m).simulated])) as Record<PaymentMethod, boolean>;
  const hosted = Object.fromEntries(PAYMENT_METHODS.map((m) => [m, !providerInfo(m).simulated && providerInfo(m).id !== "CAMPAY"])) as Record<PaymentMethod, boolean>;
  const methods = PAYMENT_METHODS.filter((m) => enabledPaymentMethods().includes(m));
  const failure = booking.payments.find((p) => p.status === "FAILED" && searchParams.echec);

  return (
    <main className="container section pay-page">
      <ol className="steps-bar" aria-label="Progression">
        <li className="done"><span>1</span>{t("pay.step1")}</li>
        <li className="on"><span>2</span>{t("pay.step2")}</li>
        <li><span>3</span>{t("pay.step3")}</li>
      </ol>
      <div className="two-col pay-cols">
        <div className="card pay-card">
          <h1>{t("pay.chooseTitle")}</h1>
          {searchParams.annule && <div className="alert info">{t("pay.cancelled")}</div>}
          {failure && <div className="alert error">{t("pay.failed", { reason: failure.failureReason ?? "" })}</div>}
          {pending ? (
            <div>
              <AutoRefresh />
              <div className="alert info">{t("pay.waiting")}</div>
              <form action={checkPaymentAction}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <button className="btn" type="submit">{t("pay.check")}</button>
              </form>
            </div>
          ) : (
            <PayForm bookingId={booking.id} amountLabel={price(booking.total, booking.currency)} methods={methods} simulated={simulated} hosted={hosted} xafNote={booking.currency === "XAF"} />
          )}
          <div className="pay-secure">
            <span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>{t("pay.secure")}</span>
            <span className="pay-brands">{["ORANGE_MONEY", "MTN_MOMO", "EXPRESS_UNION", "VISA", "MASTERCARD", "PAYPAL"].map((l) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={l} src={`/img/pay/${l}.svg`} alt={l} width={42} height={22} />)}</span>
          </div>
        </div>
        <aside className="card pay-summary">
          <h3>{t("pay.summary")}</h3>
          <p className="muted">{t("mail.reference")} <b>{booking.reference}</b></p>
          <p><strong>{booking.title}</strong><br /><span className="muted">{booking.subtitle}</span><br />{formatDateTime(booking.startAt, lang)}</p>
          <p className="muted">{booking.passengers.map((p) => p.fullName).join(", ")}</p>
          <p className="muted">{priceBreakdown(booking, t, lang)}</p>
          <div className="pay-total"><span>{t("pay.totalDue")}</span><strong>{formatMoney(booking.total, booking.currency, lang)}</strong></div>
          <p className="muted" style={{ fontSize: ".85rem" }}>{t("pay.autoCancel")}</p>
        </aside>
      </div>
    </main>
  );
}
