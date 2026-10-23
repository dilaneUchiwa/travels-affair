import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookBox, Participants, PriceBlock } from "@/components/offers";
import { BookCard, DetailHero, DetailLayout, Facts, Highlights, Lines, Policy, Prose, RouteTimeline, Section } from "@/components/detail";
import { AirlineBadge } from "@/components/AirlineBadge";
import { parseLayovers } from "@/shared/layovers";
import { formatDate, formatDateTime, formatDuration, formatTime } from "@/shared/dates";
import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/modules/auth/session";
import { createBookingAction } from "@/modules/bookings/actions";
import { getPublicFlight } from "@/modules/flights/service";
import { parsePhotos } from "@/modules/uploads/service";
import { AppError } from "@/shared/errors";

export const dynamic = "force-dynamic";

const load = (id: string) => getPublicFlight(id).catch((e) => { if (e instanceof AppError) notFound(); throw e; });

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const f = await load(params.id);
  const title = `${f.fromCity} → ${f.toCity} · ${f.airline}`;
  const photo = parsePhotos(f.photos)[0];
  return { title, description: f.description || title, alternates: { canonical: `/vols/${f.id}` }, openGraph: { title, description: f.description || title, images: photo ? [photo] : undefined } };
}

export default async function FlightPage({ params }: { params: { id: string } }) {
  const { t, lang } = getT();
  const f = await load(params.id);
  const user = await getCurrentUser();
  const jsonLd = { "@context": "https://schema.org", "@type": "Flight", flightNumber: f.id.slice(0, 6).toUpperCase(), departureAirport: { "@type": "Airport", name: f.fromAirport, iataCode: f.fromAirport }, arrivalAirport: { "@type": "Airport", name: f.toAirport, iataCode: f.toAirport }, departureTime: f.departAt.toISOString(), arrivalTime: f.arriveAt.toISOString(), provider: { "@type": "Airline", name: f.airline } };
  return (
    <main className="container section detail">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DetailHero t={t} crumb={{ href: "/vols", label: t("nav.flights") }} icon="plane" photos={f.photos}
        badges={[t(`flight.trip.${f.tripType}`), f.stops === 0 ? t("detail.nonStop") : `${f.stops} ${t("detail.stops").toLowerCase()}`]}
        title={`${f.fromCity} → ${f.toCity}`} subtitle={`${f.airline} · ${f.fromAirport} → ${f.toAirport}`} logo={f.airlineLogo} />
      <DetailLayout
        main={<>
          <div className="d-section">
            <RouteTimeline from={{ place: f.fromCity, code: f.fromAirport, time: formatTime(f.departAt, lang), date: formatDate(f.departAt, lang) }}
              to={{ place: f.toCity, code: f.toAirport, time: formatTime(f.arriveAt, lang), date: formatDate(f.arriveAt, lang) }}
              duration={formatDuration(f.departAt, f.arriveAt)} stops={parseLayovers(f.layovers)} stopsTitle={t("detail.layoverTitle")} note={f.stops === 0 ? t("flight.direct") : t("flight.stops", { n: f.stops })} />
            {f.returnDepartAt && f.returnArriveAt && (
              <>
                <h3 className="d-subtitle">{t("detail.returnFlight")}</h3>
                <RouteTimeline from={{ place: f.toCity, code: f.toAirport, time: formatTime(f.returnDepartAt, lang), date: formatDate(f.returnDepartAt, lang) }}
                  to={{ place: f.fromCity, code: f.fromAirport, time: formatTime(f.returnArriveAt, lang), date: formatDate(f.returnArriveAt, lang) }}
                  duration={formatDuration(f.returnDepartAt, f.returnArriveAt)} />
              </>
            )}
          </div>
          <Facts items={[
            { icon: "plane", label: t("detail.company"), value: <span className="airline-line"><AirlineBadge name={f.airline} logo={f.airlineLogo} size={26} />{f.airline}</span> },
            { icon: "clock", label: t("detail.duration"), value: formatDuration(f.departAt, f.arriveAt) },
            { icon: "bag", label: t("detail.baggage"), value: f.baggage },
            { icon: "users", label: t("common.seatsLabel"), value: f.seatsAvailable },
          ]} />
          {f.description && <Section title={t("detail.about")} icon="doc"><Prose text={f.description} /></Section>}
          {f.itinerary.trim() && <Section title={t("detail.itinerary")} icon="pin"><Lines text={f.itinerary} /></Section>}
          <Section title={t("detail.practical")} icon="shield">
            <Policy title={t("common.conditions")} icon="doc" text={f.conditions} />
            <Policy title={t("common.cancellation")} icon="refresh" text={f.cancellationPolicy} />
          </Section>
        </>}
        aside={
          <BookCard t={t}>
            <PriceBlock amount={f.price} currency={f.currency} unit={t("flight.perPassenger")} lang={lang} />
            <BookBox user={user} t={t} nextPath={`/vols/${f.id}`} action={createBookingAction} serviceType="FLIGHT" itemId={f.id} submit={t("book.submit")}>
              <Participants t={t} label={t("book.passengers")} />
            </BookBox>
          </BookCard>
        } />
    </main>
  );
}
