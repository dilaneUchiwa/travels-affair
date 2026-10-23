import type { Metadata } from "next";
import { OfferCard, PageHead, SearchBar } from "@/components/offers";
import { placeSuggestions } from "@/modules/catalog/places";
import { getT } from "@/i18n/server";
import { db, vehicleCategories } from "@/db";
import { searchVehicles } from "@/modules/catalog/public";

export const dynamic = "force-dynamic";
export function generateMetadata(): Metadata {
  const { t } = getT();
  return { title: t("car.title"), description: t("car.lead"), alternates: { canonical: "/voitures" } };
}

export default async function CarsPage({ searchParams }: { searchParams: { location?: string; category?: string; pickup?: string; ret?: string } }) {
  const { t, lang } = getT();
  const [rows, categories, places] = await Promise.all([searchVehicles(searchParams), db.select().from(vehicleCategories).orderBy(vehicleCategories.name), placeSuggestions("car")]);
  const qs = searchParams.pickup && searchParams.ret ? `?pickup=${searchParams.pickup}&ret=${searchParams.ret}` : "";
  return (
    <main className="container section">
      <PageHead title={t("car.title")} lead={t("car.lead")} />
      <SearchBar action="/voitures" submit={t("common.search")} fields={[
        { name: "location", label: t("car.location"), placeholder: t("car.locationPh"), value: searchParams.location, suggest: places },
        { name: "category", label: t("car.category"), type: "select", value: searchParams.category, options: [{ value: "", label: t("common.all") }, ...categories.map((c) => ({ value: c.id, label: c.name }))] },
        { name: "pickup", label: t("detail.pickup"), type: "date", value: searchParams.pickup },
        { name: "ret", label: t("detail.return"), type: "date", value: searchParams.ret },
      ]} />
      {rows.length === 0 ? <div className="alert info">{t("car.none")}</div> : (
        <div className="offer-grid">
          {rows.map((v) => (
            <OfferCard key={v.id} lang={lang} href={`/voitures/${v.id}${qs}`} photos={v.photos} fallback={`${v.model.brand.name} ${v.model.name}`} tag={v.category.name}
              title={`${v.model.brand.name} ${v.model.name}`} subtitle={v.location} meta={[t("car.seats", { n: v.seats }), ...v.amenities.split(",").map((a) => a.trim()).filter(Boolean).slice(0, 2)]}
              price={{ amount: v.pricePerDay, currency: v.currency, unit: t("car.perDay") }} cta={t("common.see")} />
          ))}
        </div>
      )}
    </main>
  );
}
