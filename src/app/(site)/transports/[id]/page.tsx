import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookBox, Participants, PriceBlock } from "@/components/offers";
import { BookCard, DetailHero, DetailLayout, Facts, Highlights, Lines, Policy, Prose, RouteTimeline, Section } from "@/components/detail";
import { formatDate, formatDateTime, formatDuration, formatTime } from "@/shared/dates";
import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/modules/auth/session";
import { createBookingAction } from "@/modules/bookings/actions";
import { getTransport } from "@/modules/catalog/public";
import { parsePhotos } from "@/modules/uploads/service";
import { AppError } from "@/shared/errors";

export const dynamic = "force-dynamic";
const load = (id: string) => getTransport(id).catch((e) => { if (e instanceof AppError) notFound(); throw e; });

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const r = await load(params.id);
  const title = `${r.fromPlace} → ${r.toPlace} · ${r.provider.name}`;
  const photo = parsePhotos(r.photos)[0];
  return { title, description: r.description || title, alternates: { canonical: `/transports/${r.id}` }, openGraph: { title, images: photo ? [photo] : undefined } };
}

export default async function TransportPage({ params }: { params: { id: string } }) {
  const { t, lang } = getT();
  const r = await load(params.id);
  const user = await getCurrentUser();
  return (
    <main className="container section detail">
      <DetailHero t={t} crumb={{ href: "/transports", label: t("nav.transports") }} icon="bus" photos={r.photos}
        badges={[t(`val.${r.mode}`)]} title={`${r.fromPlace} → ${r.toPlace}`} subtitle={r.provider.name} />
      <DetailLayout
        main={<>
          <div className="d-section">
            <RouteTimeline from={{ place: r.fromPlace, time: formatTime(r.departAt, lang), date: formatDate(r.departAt, lang) }}
              to={{ place: r.toPlace, time: formatTime(r.arriveAt, lang), date: formatDate(r.arriveAt, lang) }} duration={formatDuration(r.departAt, r.arriveAt)} />
          </div>
          <Facts items={[
            { icon: "bus", label: t("detail.mode"), value: t(`val.${r.mode}`) },
            { icon: "tag", label: t("detail.provider"), value: r.provider.name },
            { icon: "steering", label: t("detail.driver"), value: r.driverName },
            { icon: "users", label: t("common.seatsLabel"), value: r.seatsAvailable },
          ]} />
          {r.description && <Section title={t("detail.about")} icon="doc"><Prose text={r.description} /></Section>}
          <Section title={t("detail.practical")} icon="shield">
            {r.accessConditions && <Policy title={t("detail.access")} icon="doc" text={r.accessConditions} />}
            {r.provider.contact && <p className="d-note">{t("detail.provider")} : {r.provider.name} · {r.provider.contact}</p>}
          </Section>
        </>}
        aside={
          <BookCard t={t}>
            <PriceBlock amount={r.price} currency={r.currency} unit={t("common.perPerson")} lang={lang} />
            <BookBox user={user} t={t} nextPath={`/transports/${r.id}`} action={createBookingAction} serviceType="TRANSPORT" itemId={r.id} submit={t("book.submit")}>
              <Participants t={t} label={t("book.passengers")} />
            </BookBox>
          </BookCard>
        } />
    </main>
  );
}
