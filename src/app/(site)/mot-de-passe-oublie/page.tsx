import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/forms";
import { getT } from "@/i18n/server";
import { forgotPasswordAction } from "@/modules/auth/actions";

export const dynamic = "force-dynamic";
export function generateMetadata(): Metadata {
  return { title: getT().t("auth.forgotTitle"), robots: { index: false } };
}

export default function ForgotPage({ searchParams }: { searchParams: { envoye?: string } }) {
  const { t } = getT();
  return (
    <main className="container">
      <div className="card narrow">
        <h1>{t("auth.forgotTitle")}</h1>
        {searchParams.envoye ? (
          <div className="alert success">{t("auth.forgotSent")}</div>
        ) : (
          <ActionForm action={forgotPasswordAction}>
            <p className="muted" style={{ marginBottom: "1rem" }}>{t("auth.forgotLead")}</p>
            <div className="field"><label htmlFor="email">{t("auth.email")}</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
            <div style={{ marginTop: "1.25rem" }}><SubmitButton>{t("auth.forgotSubmit")}</SubmitButton></div>
          </ActionForm>
        )}
        <p className="muted" style={{ marginTop: "1rem" }}><Link href="/connexion">{t("auth.login")}</Link></p>
      </div>
    </main>
  );
}
