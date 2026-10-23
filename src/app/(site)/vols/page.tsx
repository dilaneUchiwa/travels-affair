import type { Metadata } from "next";
import { Finder } from "@/components/Finder";
import { FlightCard } from "@/components/FlightCard";
import { PageHead } from "@/components/offers";
import { getT } from "@/i18n/server";
import { searchFlights } from "@/modules/flights/service";

export const dynamic = "force-dynamic";
export function generateMetadata(): Metadata {
  const { t } = getT();
  return { title: t("flight.title"), description: t("flight.lead"), alternates: { canonical: "/vols" } };
}

type Props = { searchParams: { from?: string; to?: string; date?: string } };

export default async function FlightsPage({ searchParams }: Props) {
  const { t } = getT();
  const flights = await searchFlights(searchParams);
  return (
    <main className="container section">
      <PageHead title={t("flight.title")} lead={t("flight.lead")} />
      <Finder values={searchParams} compact />
      {flights.length === 0 ? <div className="alert info">{t("flight.none")}</div> : flights.map((f) => <FlightCard key={f.id} flight={f} />)}
    </main>
  );
}
