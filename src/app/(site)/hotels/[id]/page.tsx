import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookBox, Participants, PriceBlock } from "@/components/offers";
import { DetailHero, Facts, Highlights, Lines, Policy, Prose, Section, Icon } from "@/components/detail";
import { Stars } from "@/components/Stars";
import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/modules/auth/session";
import { createBookingAction } from "@/modules/bookings/actions";
import { getHotel, propertyFreeUnits } from "@/modules/catalog/public";
import { parsePhotos } from "@/modules/uploads/service";
import { daysBetween, todayInDouala } from "@/shared/dates";
import { AppError } from "@/shared/errors";
import { price } from "@/shared/price";

export const dynamic = "force-dynamic";
const load = (id: string) => getHotel(id).catch((e) => { if (e instanceof AppError) notFound(); throw e; });

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const h = await load(params.id);
  const title = `${h.name} · ${h.city}`;
  const photo = parsePhotos(h.photos)[0];
  return { title, description: h.description || title, alternates: { canonical: `/hotels/${h.id}` }, openGraph: { title, description: h.description || title, images: photo ? [photo] : undefined } };
}

type SP = { in?: string; out?: string; units?: string };

export default async function HotelPage({ params, searchParams }: { params: { id: string }; searchParams: SP }) {
  const { t, lang } = getT();
  const hotel = await load(params.id);
  const user = await getCurrentUser();
  const dates = searchParams.in && searchParams.out && searchParams.out > searchParams.in ? { in: searchParams.in, out: searchParams.out } : null;
  const nights = dates ? daysBetween(dates.in, dates.out) : 0;
  const units = Math.min(10, Math.max(1, Number(searchParams.units) || 1));
  const free = await Promise.all(hotel.properties.map((p) => propertyFreeUnits(p.id, dates?.in, dates?.out)));
  const today = todayInDouala();
  const jsonLd = { "@context": "https://schema.org", "@type": "Hotel", name: hotel.name, starRating: { "@type": "Rating", ratingValue: hotel.stars }, address: { "@type": "PostalAddress", streetAddress: hotel.address, addressLocality: hotel.city, addressCountry: hotel.country } };

  return (
    <main className="container section detail">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DetailHero t={t} crumb={{ href: "/hotels", label: t("nav.hotels") }} icon="bed" photos={hotel.photos}
        badges={[t(`hotel.cat.${hotel.category}`)]} stars={hotel.stars} title={hotel.name}
        subtitle={[hotel.address, hotel.city, hotel.country].filter(Boolean).join(", ")} />
      <div className="d-layout single">
        <div className="d-main">
          <Facts items={[
            { icon: "bed", label: t("detail.category"), value: t(`hotel.cat.${hotel.category}`) },
            { icon: "star", label: t("detail.stars"), value: hotel.stars ? <Stars value={hotel.stars} size={18} label={`${hotel.stars}/5`} /> : "" },
            { icon: "pin", label: t("detail.location"), value: `${hotel.city}, ${hotel.country}` },
            { icon: "tag", label: t("detail.fromPrice"), value: hotel.properties.length ? price(Math.min(...hotel.properties.map((p) => p.pricePerNight)), hotel.properties[0].currency) + " " + t("hotel.perNight") : "" },
          ]} />
          {hotel.description && <Section title={t("detail.about")} icon="doc"><Prose text={hotel.description} /></Section>}
          {hotel.amenities.trim() && <Section title={t("detail.highlights")} icon="star"><Highlights csv={hotel.amenities} /></Section>}

          <Section title={t("hotel.properties")} icon="bed">
            <form className="d-dates" method="get">
              <div><label htmlFor="in">{t("detail.checkIn")}</label><input id="in" name="in" type="date" min={today} defaultValue={searchParams.in} required /></div>
              <div><label htmlFor="out">{t("detail.checkOut")}</label><input id="out" name="out" type="date" min={today} defaultValue={searchParams.out} required /></div>
              <div><label htmlFor="units">{t("hotel.units")}</label><input id="units" name="units" type="number" min={1} max={10} defaultValue={units} /></div>
              <button className="btn" type="submit">{t("hotel.checkAvailability")}</button>
            </form>
            {hotel.properties.length === 0 && <p className="muted">{t("hotel.noProperty")}</p>}
            {hotel.properties.map((p, i) => {
              const f = free[i];
              const available = f === null ? true : f >= units;
              return (
                <article className="d-room" key={p.id}>
                  <div className="d-room-info">
                    <h3>{p.name}</h3>
                    <p className="muted"><Icon name="users" size={15} /> {t("hotel.capacity", { n: p.capacity })}</p>
                    {p.roomsDetail.trim() && <Lines text={p.roomsDetail} />}
                    <Highlights csv={p.amenities} />
                  </div>
                  <div className="d-room-book">
                    <PriceBlock amount={p.pricePerNight} currency={p.currency} unit={t("hotel.perNight")} lang={lang} />
                    {dates && <p className="d-total">{t("hotel.stayTotal", { n: nights, total: price(p.pricePerNight, p.currency, nights * units) })}</p>}
                    {f !== null && <p className={`d-avail ${available ? "ok" : "no"}`}>{available ? t("hotel.freeUnits", { n: f }) : t("hotel.soldOut")}</p>}
                    {!dates ? <p className="muted">{t("hotel.pickDates")}</p> : !available ? null : (
                      <BookBox user={user} t={t} nextPath={`/hotels/${hotel.id}?in=${dates.in}&out=${dates.out}&units=${units}`} action={createBookingAction} serviceType="HOTEL" itemId={p.id} submit={t("book.submit")}>
                        <input type="hidden" name="checkIn" value={dates.in} />
                        <input type="hidden" name="checkOut" value={dates.out} />
                        <input type="hidden" name="units" value={units} />
                        <Participants t={t} label={t("book.guests")} placeholder="Jean Dupont" />
                      </BookBox>
                    )}
                  </div>
                </article>
              );
            })}
          </Section>

          {(hotel.conditions || hotel.cancellationPolicy) && (
            <Section title={t("detail.practical")} icon="shield">
              <Policy title={t("common.conditions")} icon="doc" text={hotel.conditions} />
              <Policy title={t("common.cancellation")} icon="refresh" text={hotel.cancellationPolicy} />
            </Section>
          )}
        </div>
      </div>
    </main>
  );
}
