import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT } from "@/i18n/server";
import { getPage } from "@/modules/catalog/public";
import { parseBody } from "@/modules/content/service";

export const dynamic = "force-dynamic";
const SLUG = "agence";

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = getT();
  const page = await getPage(SLUG);
  if (!page) return {};
  const title = lang === "en" ? page.titleEn : page.titleFr;
  return { title, alternates: { canonical: `/${SLUG}` } };
}

export default async function InfoPage() {
  const { lang } = getT();
  const page = await getPage(SLUG);
  if (!page) notFound();
  const body = parseBody(lang === "en" && page.bodyEn ? page.bodyEn : page.bodyFr);
  return (
    <main className="container section">
      <div className="card prose">
        <h1>{lang === "en" ? page.titleEn : page.titleFr}</h1>
        {body.map((b, i) => (b.type === "h" ? <h2 key={i}>{b.text}</h2> : <p key={i}>{b.text}</p>))}
      </div>
    </main>
  );
}
