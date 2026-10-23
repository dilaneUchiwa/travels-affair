import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/forms";
import { getT } from "@/i18n/server";
import { registerAction } from "@/modules/auth/actions";

export const dynamic = "force-dynamic";
export function generateMetadata(): Metadata {
  return { title: getT().t("auth.signup"), robots: { index: false } };
}

export default function RegisterPage({ searchParams }: { searchParams: { next?: string } }) {
  const { t } = getT();
  return (
    <main className="container">
      <div className="card narrow">
        <h1>{t("auth.signup")}</h1>
        <ActionForm action={registerAction}>
          <input type="hidden" name="next" value={searchParams.next ?? ""} />
          <div className="field"><label htmlFor="name">{t("auth.name")}</label><input id="name" name="name" autoComplete="name" required /></div>
          <div className="field"><label htmlFor="email">{t("auth.email")}</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
          <div className="field"><label htmlFor="password">{t("auth.passwordNew")}</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required /></div>
          <div style={{ marginTop: "1.25rem" }}><SubmitButton>{t("auth.submitSignup")}</SubmitButton></div>
        </ActionForm>
        <p className="muted" style={{ marginTop: "1rem" }}>{t("auth.haveAccount")} <Link href="/connexion">{t("auth.login")}</Link></p>
      </div>
    </main>
  );
}
