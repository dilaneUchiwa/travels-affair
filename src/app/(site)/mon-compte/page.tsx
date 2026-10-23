import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { getT } from "@/i18n/server";
import { requireUser } from "@/modules/auth/session";
import { cancelBookingAction } from "@/modules/bookings/actions";
import { listBookingsForUser } from "@/modules/bookings/service";
import { formatDateTime } from "@/shared/dates";
import { formatMoney } from "@/shared/money";

export const dynamic = "force-dynamic";
export function generateMetadata(): Metadata {
  return { title: getT().t("account.title"), robots: { index: false } };
}

export default async function AccountPage() {
  const { t, lang } = getT();
  const user = await requireUser();
  const bookings = await listBookingsForUser(user.id);
  return (
    <main className="container section">
      <h1>{t("account.hello", { name: user.name })}</h1>
      <h2>{t("account.bookings")}</h2>
      {bookings.length === 0 ? (
        <div className="alert info">{t("account.none")} <Link href="/vols">{t("account.browse")}</Link></div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>{t("mail.reference")}</th><th>{t("mail.service")}</th><th>{t("detail.start")}</th><th>{t("mail.total")}</th><th>{t("doc.status")}</th><th /></tr></thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.reference}</strong></td>
                  <td>{b.title}<br /><span className="muted">{t(`service.${b.serviceType}`)}</span></td>
                  <td>{formatDateTime(b.startAt, lang)}</td>
                  <td>{formatMoney(b.total, b.currency, lang)}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {b.status === "PENDING_PAYMENT" ? (
                      <div style={{ display: "flex", gap: ".4rem" }}>
                        <Link className="btn small" href={`/reservation/${b.id}/paiement`}>{t("account.pay")}</Link>
                        <form action={cancelBookingAction}><input type="hidden" name="bookingId" value={b.id} /><button className="btn secondary small" type="submit">{t("account.cancel")}</button></form>
                      </div>
                    ) : (
                      <Link className="btn secondary small" href={`/mon-compte/reservations/${b.id}`}>{t("account.details")}</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
