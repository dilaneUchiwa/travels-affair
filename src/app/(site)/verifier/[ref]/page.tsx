import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { bookings, db } from "@/db";
import { Icon } from "@/components/detail";
import { getT } from "@/i18n/server";
import { verifyToken } from "@/modules/documents/qr";
import { parseDetails } from "@/modules/bookings/view";
import { formatDateTime } from "@/shared/dates";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vérification", robots: { index: false, follow: false } };

const VALID = new Set(["PAID", "AWAITING_CONFIRMATION", "CONFIRMED", "MODIFIED"]);
/** « Jean Dupont » → « Jean D. » : la page est publique, on ne dévoile pas les noms complets. */
const mask = (n: string) => { const p = n.trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0]; };

export default async function VerifyPage({ params, searchParams }: { params: { ref: string }; searchParams: { t?: string } }) {
  const { t, lang } = getT();
  const authentic = !!searchParams.t && verifyToken(params.ref, searchParams.t);
  const [b] = authentic ? await db.select().from(bookings).where(eq(bookings.reference, params.ref)) : [];
  const state = !b ? "unknown" : VALID.has(b.status) ? "valid" : b.status === "PENDING_PAYMENT" ? "unpaid" : "void";
  const names = b ? (parseDetails(b).find(([k]) => k === "participants")?.[1] ?? "").split(",").filter(Boolean).map(mask) : [];
  return (
    <main className="container section">
      <div className={`verify ${state}`}>
        <div className="verify-badge">
          {state === "valid" ? <Icon name="check" size={34} /> : <span>!</span>}
        </div>
        <h1>{t(`verify.${state}`)}</h1>
        <p className="muted">{t(`verify.${state}Hint`)}</p>
        {b && (
          <dl className="verify-card">
            <dt>{t("mail.reference")}</dt><dd><b>{b.reference}</b></dd>
            <dt>{t("mail.service")}</dt><dd>{t(`service.${b.serviceType}`)}</dd>
            <dt>{t("verify.offer")}</dt><dd>{b.title}<br /><small className="muted">{b.subtitle}</small></dd>
            <dt>{t("detail.departure")}</dt><dd>{formatDateTime(b.startAt, lang)}</dd>
            {names.length > 0 && (<><dt>{t("detail.participants")}</dt><dd>{names.join(", ")}</dd></>)}
            <dt>{t("doc.status")}</dt><dd>{t(`status.${b.status}`)}</dd>
          </dl>
        )}
      </div>
    </main>
  );
}
