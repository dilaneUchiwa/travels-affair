import type { Metadata } from "next";
import { OfferCard, PageHead, SearchBar } from "@/components/offers";
import { Stars } from "@/components/Stars";
import { placeSuggestions } from "@/modules/catalog/places";
import { getT } from "@/i18n/server";
import { searchHotels } from "@/modules/catalog/public";

export const dynamic = "force-dynamic";
export function generateMetadata(): Metadata {
  const { t } = getT();
  return { title: t("hotel.title"), description: t("hotel.lead"), alternates: { canonical: "/hotels" } };
}

export default async function HotelsPage({ searchParams }: { searchParams: { q?: string; stars?: string } }) {
  const { t, lang } = getT();
  const [results, places] = await Promise.all([searchHotels(searchParams), placeSuggestions("hotel")]);
  return (
    <main className="container section">
      <PageHead title={t("hotel.title")} lead={t("hotel.lead")} />
      <SearchBar action="/hotels" submit={t("common.search")} fields={[
        { name: "q", label: t("hotel.q"), placeholder: t("hotel.qPh"), value: searchParams.q, suggest: places },
        { name: "stars", label: t("hotel.stars"), type: "select", value: searchParams.stars, options: [{ value: "", label: t("common.all") }, ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: "★".repeat(n) }))] },
      ]} />
      {results.length === 0 ? <div className="alert info">{t("hotel.none")}</div> : (
        <div className="offer-grid">
          {results.map(({ hotel: h, from }) => (
            <OfferCard key={h.id} lang={lang} href={`/hotels/${h.id}`} photos={h.photos} fallback={h.name} tag={t(`hotel.cat.${h.category}`)}
              title={h.name} subtitle={`${h.city}, ${h.country}`} meta={[<Stars key="s" value={h.stars} size={15} />, ...h.amenities.split(",").map((a) => a.trim()).filter(Boolean).slice(0, 3)]}
              price={{ amount: from.price, currency: from.currency, unit: t("hotel.fromPerNight") }} cta={t("common.see")} />
          ))}
        </div>
      )}
    </main>
  );
}
