import type { Metadata } from "next";
import { ActionForm, SubmitButton } from "@/components/forms";
import { PageHead } from "@/components/offers";
import { cfg, loadConfig } from "@/modules/settings/service";
import { getT } from "@/i18n/server";
import { contactAction } from "@/modules/content/actions";

export const dynamic = "force-dynamic";
export function generateMetadata(): Metadata {
  const { t } = getT();
  return { title: t("contact.title"), description: t("contact.lead"), alternates: { canonical: "/contact" } };
}

export default async function ContactPage({ searchParams }: { searchParams: { envoye?: string } }) {
  await loadConfig();
  const { t, lang } = getT();
  return (
    <main className="container section">
      <PageHead title={t("contact.title")} lead={t("contact.lead")} />
      <div className="two-col">
        <div className="card">
          {searchParams.envoye ? (
            <div className="alert success">{t("contact.sent")}</div>
          ) : (
            <ActionForm action={contactAction}>
              <div className="grid-2">
                <div className="field"><label htmlFor="name">{t("auth.name")}</label><input id="name" name="name" autoComplete="name" required /></div>
                <div className="field"><label htmlFor="email">{t("auth.email")}</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
              </div>
              <div className="field"><label htmlFor="subject">{t("contact.subject")}</label><input id="subject" name="subject" required /></div>
              <div className="field"><label htmlFor="message">{t("contact.message")}</label><textarea id="message" name="message" rows={6} required minLength={10} /></div>
              <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
              <div style={{ marginTop: "1.25rem" }}><SubmitButton>{t("contact.submit")}</SubmitButton></div>
            </ActionForm>
          )}
        </div>
        <aside className="card">
          <h3>{cfg("agency.name")}</h3>
          <p>{cfg("agency.address")}</p>
          {cfg("agency.phone") && <p><a href={`tel:${cfg("agency.phone").replace(/\s/g, "")}`}>{cfg("agency.phone")}</a></p>}
          {cfg("agency.email") && <p><a href={`mailto:${cfg("agency.email")}`}>{cfg("agency.email")}</a></p>}
          {cfg("agency.whatsapp") && <p><a href={`https://wa.me/${cfg("agency.whatsapp").replace(/\D/g, "")}`} rel="noopener">WhatsApp</a></p>}
          <p className="muted">{lang === "en" ? cfg("agency.hoursEn") : cfg("agency.hoursFr")}</p>
        </aside>
      </div>
    </main>
  );
}
