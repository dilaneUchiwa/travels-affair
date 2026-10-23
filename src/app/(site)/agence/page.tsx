import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT } from "@/i18n/server";
import { getPage } from "@/modules/catalog/public";
import { parseBody } from "@/modules/content/service";
import { Partners } from "@/components/Partners";

export const dynamic = "force-dynamic";
const SLUG = "agence";

// Photos de l'agence récupérées sur travels-affair.com
const GALLERY = [
  { src: "/img/site/devanture.jpg", alt: "Devanture de l'agence Travel's Affair à Yaoundé-Tsinga" },
  { src: "/img/site/agence-1.jpg", alt: "Accueil de l'agence Travel's Affair" },
  { src: "/img/site/agence-2.jpg", alt: "Espace conseil de l'agence" },
  { src: "/img/site/agence-4.jpg", alt: "Équipe Travel's Affair" },
  { src: "/img/site/agence-5.jpg", alt: "Bureaux de l'agence" },
  { src: "/img/site/agence-6.jpg", alt: "Locaux de l'agence Travel's Affair" },
];

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

      <section className="agency-gallery" aria-label={lang === "en" ? "Our premises" : "Nos locaux"}>
        <h2>{lang === "en" ? "Our premises" : "Nos locaux"}</h2>
        <div className="agency-gallery-grid">
          {GALLERY.map((g) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={g.src} src={g.src} alt={g.alt} loading="lazy" width="800" height="599" />
          ))}
        </div>
      </section>

      <Partners lang={lang} />
    </main>
  );
}
