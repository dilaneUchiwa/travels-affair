import type { Metadata } from "next";
import { ActionForm, SubmitButton } from "@/components/forms";
import { getT } from "@/i18n/server";
import { resetPasswordAction } from "@/modules/auth/actions";

export const dynamic = "force-dynamic";
export function generateMetadata(): Metadata {
  return { title: getT().t("auth.resetTitle"), robots: { index: false } };
}

export default function ResetPage({ searchParams }: { searchParams: { token?: string } }) {
  const { t } = getT();
  return (
    <main className="container">
      <div className="card narrow">
        <h1>{t("auth.resetTitle")}</h1>
        <ActionForm action={resetPasswordAction}>
          <input type="hidden" name="token" value={searchParams.token ?? ""} />
          <div className="field"><label htmlFor="password">{t("auth.passwordNew")}</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required /></div>
          <div style={{ marginTop: "1.25rem" }}><SubmitButton>{t("auth.resetSubmit")}</SubmitButton></div>
        </ActionForm>
      </div>
    </main>
  );
}
