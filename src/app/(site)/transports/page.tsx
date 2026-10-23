import type { Metadata } from "next";
import { OfferCard, PageHead, SearchBar } from "@/components/offers";
import { placeSuggestions } from "@/modules/catalog/places";
import { getT } from "@/i18n/server";
import { searchTransports } from "@/modules/catalog/public";
import { formatDateTime } from "@/shared/dates";

export const dynamic = "force-dynamic";
export function generateMetadata(): Metadata {
  const { t } = getT();
  return { title: t("transport.title"), description: t("transport.lead"), alternates: { canonical: "/transports" } };
}

export default async function TransportsPage({ searchParams }: { searchParams: { from?: string; to?: string; date?: string; mode?: string } }) {
  const { t, lang } = getT();
  const [rows, fromOpts, toOpts] = await Promise.all([searchTransports(searchParams), placeSuggestions("transportFrom"), placeSuggestions("transportTo")]);
  return (
    <main className="container section">
      <PageHead title={t("transport.title")} lead={t("transport.lead")} />
      <SearchBar action="/transports" submit={t("common.search")} fields={[
        { name: "from", label: t("transport.from"), value: searchParams.from, suggest: fromOpts },
        { name: "to", label: t("transport.to"), value: searchParams.to, suggest: toOpts },
        { name: "date", label: t("flight.date"), type: "date", value: searchParams.date },
        { name: "mode", label: t("transport.mode"), type: "select", value: searchParams.mode, options: [{ value: "", label: t("common.all") }, ...["BUS", "TRAIN", "SHUTTLE"].map((m) => ({ value: m, label: t(`val.${m}`) }))] },
      ]} />
      {rows.length === 0 ? <div className="alert info">{t("transport.none")}</div> : (
        <div className="offer-grid">
          {rows.map((r) => (
            <OfferCard key={r.id} lang={lang} href={`/transports/${r.id}`} photos={r.photos} fallback={t(`val.${r.mode}`)} tag={t(`val.${r.mode}`)}
              title={`${r.fromPlace} → ${r.toPlace}`} subtitle={r.provider.name} meta={[formatDateTime(r.departAt, lang), t("common.seatsLeft", { n: r.seatsAvailable })]}
              price={{ amount: r.price, currency: r.currency, unit: t("common.perPerson") }} cta={t("common.book")} />
          ))}
        </div>
      )}
    </main>
  );
}
