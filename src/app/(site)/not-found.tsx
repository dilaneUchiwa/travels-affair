import Link from "next/link";
import { getT } from "@/i18n/server";

export default function NotFound() {
  const { t } = getT();
  return (
    <main className="container section" style={{ textAlign: "center" }}>
      <h1>{t("error.notFound")}</h1>
      <p className="muted">{t("error.notFoundText")}</p>
      <Link className="btn" href="/">{t("error.home")}</Link>
    </main>
  );
}
