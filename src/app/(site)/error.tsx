"use client";

import { useT } from "@/i18n/client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const { t } = useT();
  return (
    <main className="container section" style={{ textAlign: "center" }}>
      <h1>{t("error.title")}</h1>
      <p className="muted">{t("error.text")}</p>
      <button className="btn" onClick={reset}>{t("error.retry")}</button>
    </main>
  );
}
