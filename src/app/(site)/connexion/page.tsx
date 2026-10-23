import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/forms";
import { getT } from "@/i18n/server";
import { LoginFields } from "@/components/LoginFields";
import { loginAction } from "@/modules/auth/actions";

export const dynamic = "force-dynamic";
export function generateMetadata(): Metadata {
  return { title: getT().t("auth.login"), robots: { index: false } };
}

export default function LoginPage({ searchParams }: { searchParams: { next?: string; reinit?: string } }) {
  const { t } = getT();
  // Comptes de démonstration préremplis. À désactiver en production : DEMO_LOGIN=false
  const demo = process.env.DEMO_LOGIN === "false" ? [] : [
    { label: "Client", email: "demo@client.com", password: "Client123!" },
    { label: "Administrateur", email: "admin@travels-affair.com", password: "Admin123!" },
  ];
  const next = searchParams.next ? `?next=${encodeURIComponent(searchParams.next)}` : "";
  return (
    <main className="container">
      <div className="card narrow">
        <h1>{t("auth.login")}</h1>
        {searchParams.reinit && <div className="alert success">{t("auth.resetDone")}</div>}
        <ActionForm action={loginAction}>
          <input type="hidden" name="next" value={searchParams.next ?? ""} />
          <LoginFields demo={demo} labels={{ email: t("auth.email"), password: t("auth.password"), demo: "Démo :" }} />
          <div style={{ marginTop: "1.25rem" }}><SubmitButton>{t("auth.submitLogin")}</SubmitButton></div>
        </ActionForm>
        <p className="muted" style={{ marginTop: "1rem" }}><Link href="/mot-de-passe-oublie">{t("auth.forgot")}</Link></p>
        <p className="muted">{t("auth.noAccount")} <Link href={`/inscription${next}`}>{t("auth.signup")}</Link></p>
      </div>
    </main>
  );
}
