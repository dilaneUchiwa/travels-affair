import type { Metadata } from "next";
import { PageHead } from "@/components/offers";
import { getT } from "@/i18n/server";
import { listFaq } from "@/modules/catalog/public";

export const dynamic = "force-dynamic";
export function generateMetadata(): Metadata {
  const { t } = getT();
  return { title: t("faq.title"), description: t("faq.lead"), alternates: { canonical: "/faq" } };
}

export default async function FaqPage() {
  const { t, lang } = getT();
  const items = (await listFaq()).map((q) => ({ q: (lang === "en" && q.questionEn) || q.questionFr, a: (lang === "en" && q.answerEn) || q.answerFr }));
  const jsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })) };
  return (
    <main className="container section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHead title={t("faq.title")} lead={t("faq.lead")} />
      <div className="card faq">
        {items.length === 0 && <p className="muted">{t("faq.none")}</p>}
        {items.map((i) => <details key={i.q}><summary>{i.q}</summary><p>{i.a}</p></details>)}
      </div>
    </main>
  );
}
