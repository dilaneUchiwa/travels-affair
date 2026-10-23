import type { Metadata } from "next";
import { OfferCard, PageHead, SearchBar } from "@/components/offers";
import { placeSuggestions } from "@/modules/catalog/places";
import { getT } from "@/i18n/server";
import { searchActivities } from "@/modules/catalog/public";
import { formatDateTime } from "@/shared/dates";

export const dynamic = "force-dynamic";
export function generateMetadata(): Metadata {
  const { t } = getT();
  return { title: t("activity.title"), description: t("activity.lead"), alternates: { canonical: "/activites" } };
}

export default async function ActivitiesPage({ searchParams }: { searchParams: { q?: string; date?: string } }) {
  const { t, lang } = getT();
  const [rows, places] = await Promise.all([searchActivities(searchParams), placeSuggestions("activity")]);
  return (
    <main className="container section">
      <PageHead title={t("activity.title")} lead={t("activity.lead")} />
      <SearchBar action="/activites" submit={t("common.search")} fields={[
        { name: "q", label: t("activity.q"), placeholder: t("activity.qPh"), value: searchParams.q, suggest: places },
        { name: "date", label: t("flight.date"), type: "date", value: searchParams.date },
      ]} />
      {rows.length === 0 ? <div className="alert info">{t("activity.none")}</div> : (
        <div className="offer-grid">
          {rows.map((a) => (
            <OfferCard key={a.id} lang={lang} href={`/activites/${a.id}`} photos={a.photos} fallback={a.title}
              title={a.title} subtitle={`${a.city}, ${a.country}`} meta={[formatDateTime(a.startAt, lang), `${a.durationHours} h`, t("common.seatsLeft", { n: a.placesAvailable })]}
              price={{ amount: a.price, currency: a.currency, unit: t("common.perPerson") }} cta={t("common.book")} />
          ))}
        </div>
      )}
    </main>
  );
}
