import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookBox, Participants, PriceBlock } from "@/components/offers";
import { BookCard, DetailHero, DetailLayout, Facts, Highlights, Lines, Policy, Prose, RouteTimeline, Section } from "@/components/detail";
import { formatDateTime } from "@/shared/dates";
import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/modules/auth/session";
import { createBookingAction } from "@/modules/bookings/actions";
import { getActivity } from "@/modules/catalog/public";
import { parsePhotos } from "@/modules/uploads/service";
import { AppError } from "@/shared/errors";

export const dynamic = "force-dynamic";
const load = (id: string) => getActivity(id).catch((e) => { if (e instanceof AppError) notFound(); throw e; });

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const a = await load(params.id);
  const photo = parsePhotos(a.photos)[0];
  return { title: `${a.title} · ${a.city}`, description: a.description || a.title, alternates: { canonical: `/activites/${a.id}` }, openGraph: { title: a.title, images: photo ? [photo] : undefined } };
}

export default async function ActivityPage({ params }: { params: { id: string } }) {
  const { t, lang } = getT();
  const a = await load(params.id);
  const user = await getCurrentUser();
  return (
    <main className="container section detail">
      <DetailHero t={t} crumb={{ href: "/activites", label: t("nav.activities") }} icon="star" photos={a.photos}
        badges={[t("service.ACTIVITY")]} title={a.title} subtitle={`${a.city}, ${a.country}`} />
      <DetailLayout
        main={<>
          <Facts items={[
            { icon: "calendar", label: t("detail.start"), value: formatDateTime(a.startAt, lang) },
            { icon: "clock", label: t("detail.durationHours"), value: `${a.durationHours} h` },
            { icon: "pin", label: t("detail.location"), value: `${a.city}, ${a.country}` },
            { icon: "users", label: t("common.seatsLabel"), value: a.placesAvailable },
          ]} />
          {a.description && <Section title={t("detail.about")} icon="doc"><Prose text={a.description} /></Section>}
          <Section title={t("detail.practical")} icon="shield">
            <Policy title={t("common.conditions")} icon="doc" text={a.conditions} />
            <Policy title={t("common.cancellation")} icon="refresh" text={a.cancellationPolicy} />
          </Section>
        </>}
        aside={
          <BookCard t={t}>
            <PriceBlock amount={a.price} currency={a.currency} unit={t("common.perPerson")} lang={lang} />
            <BookBox user={user} t={t} nextPath={`/activites/${a.id}`} action={createBookingAction} serviceType="ACTIVITY" itemId={a.id} submit={t("book.submit")}>
              <Participants t={t} label={t("book.participants")} />
            </BookBox>
          </BookCard>
        } />
    </main>
  );
}
