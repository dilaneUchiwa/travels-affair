import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookBox, Participants, PriceBlock } from "@/components/offers";
import { BookCard, DetailHero, DetailLayout, Facts, Highlights, Policy, Section } from "@/components/detail";
import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/modules/auth/session";
import { createBookingAction } from "@/modules/bookings/actions";
import { getVehicle, vehicleFreeUnits } from "@/modules/catalog/public";
import { parsePhotos } from "@/modules/uploads/service";
import { daysBetween, todayInDouala } from "@/shared/dates";
import { AppError } from "@/shared/errors";
import { price } from "@/shared/price";

export const dynamic = "force-dynamic";
const load = (id: string) => getVehicle(id).catch((e) => { if (e instanceof AppError) notFound(); throw e; });

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const v = await load(params.id);
  const title = `${v.model.brand.name} ${v.model.name} · ${v.location}`;
  const photo = parsePhotos(v.photos)[0];
  return { title, description: title, alternates: { canonical: `/voitures/${v.id}` }, openGraph: { title, images: photo ? [photo] : undefined } };
}

export default async function CarPage({ params, searchParams }: { params: { id: string }; searchParams: { pickup?: string; ret?: string; units?: string } }) {
  const { t, lang } = getT();
  const v = await load(params.id);
  const user = await getCurrentUser();
  const ok = searchParams.pickup && searchParams.ret && searchParams.ret > searchParams.pickup;
  const days = ok ? daysBetween(searchParams.pickup!, searchParams.ret!) : 0;
  const units = Math.min(10, Math.max(1, Number(searchParams.units) || 1));
  const free = ok ? await vehicleFreeUnits(v.id, searchParams.pickup, searchParams.ret) : null;
  const available = free === null ? true : free >= units;
  const today = todayInDouala();
  const name = `${v.model.brand.name} ${v.model.name}`;
  return (
    <main className="container section detail">
      <DetailHero t={t} crumb={{ href: "/voitures", label: t("nav.cars") }} icon="car" photos={v.photos}
        badges={[v.category.name, v.model.brand.name]} title={name} subtitle={v.location} />
      <DetailLayout
        main={<>
          <Facts items={[
            { icon: "car", label: t("detail.vehicle"), value: name },
            { icon: "tag", label: t("detail.category"), value: v.category.name },
            { icon: "users", label: t("detail.capacity"), value: t("car.seats", { n: v.seats }) },
            { icon: "pin", label: t("detail.location"), value: v.location },
          ]} />
          {v.amenities.trim() && <Section title={t("detail.highlights")} icon="star"><Highlights csv={v.amenities} /></Section>}
          {v.conditions && <Section title={t("detail.practical")} icon="shield"><Policy title={t("car.rentalConditions")} icon="doc" text={v.conditions} /></Section>}
        </>}
        aside={
          <BookCard t={t}>
            <PriceBlock amount={v.pricePerDay} currency={v.currency} unit={t("car.perDay")} lang={lang} />
            <form method="get" className="d-dates stacked">
              <div><label htmlFor="pickup">{t("detail.pickup")}</label><input id="pickup" name="pickup" type="date" min={today} defaultValue={searchParams.pickup} required /></div>
              <div><label htmlFor="ret">{t("detail.return")}</label><input id="ret" name="ret" type="date" min={today} defaultValue={searchParams.ret} required /></div>
              <div><label htmlFor="units">{t("car.units")}</label><input id="units" name="units" type="number" min={1} max={10} defaultValue={units} /></div>
              <button className="btn secondary" type="submit">{t("hotel.checkAvailability")}</button>
            </form>
            {ok && (
              <>
                <p className="d-total">{t("car.rentalTotal", { n: days, total: price(v.pricePerDay, v.currency, days * units) })}</p>
                {!available ? <p className="d-avail no">{t("car.unavailable")}</p> : (
                  <BookBox user={user} t={t} nextPath={`/voitures/${v.id}?pickup=${searchParams.pickup}&ret=${searchParams.ret}&units=${units}`} action={createBookingAction} serviceType="CAR" itemId={v.id} submit={t("book.submit")}>
                    <input type="hidden" name="pickupDate" value={searchParams.pickup} />
                    <input type="hidden" name="returnDate" value={searchParams.ret} />
                    <input type="hidden" name="units" value={units} />
                    <Participants t={t} label={t("book.driver")} placeholder="Jean Dupont" />
                  </BookBox>
                )}
              </>
            )}
          </BookCard>
        } />
    </main>
  );
}
