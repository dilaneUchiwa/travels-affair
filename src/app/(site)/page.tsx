import { AirlineBadge } from "@/components/AirlineBadge";
import { parseLayovers } from "@/shared/layovers";
import Link from "next/link";
import { Finder } from "@/components/Finder";
import { ActivitySearch, CarSearch, HotelSearch, TransportSearch } from "@/components/QuickSearch";
import { SearchTabs } from "@/components/SearchTabs";
import { Partners } from "@/components/Partners";
import { getT } from "@/i18n/server";
import { featuredFlights } from "@/modules/flights/service";
import { formatDateTime, formatDuration } from "@/shared/dates";
import { price } from "@/shared/price";

export const dynamic = "force-dynamic";

// Ville de destination -> photo (public/img/p). Repli sur l'image d'accueil.
const CITY_IMG: Record<string, string> = {
  douala: "city-douala", yaounde: "city-yaounde", kribi: "city-kribi", paris: "city-paris",
  bruxelles: "city-bruxelles", istanbul: "city-istanbul", casablanca: "city-casablanca",
  "addis-abeba": "city-addis", "addis abeba": "city-addis", londres: "city-londres",
};
const cityImg = (city: string) => {
  const key = city.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const slug = CITY_IMG[key];
  return slug ? `/img/p/${slug}.jpg` : "/img/hero.jpg";
};

const STEPS = [1, 2, 3];
const SERVICES = [
  { href: "/vols", key: "flights", d: "M2.5 13.5 21 4l-4 16-5.5-5.5-3 4v-5.5z" },
  { href: "/hotels", key: "hotels", d: "M3 20V8l9-5 9 5v12M9 20v-6h6v6" },
  { href: "/transports", key: "transports", d: "M5 16h14V6H5zM5 12h14M8 19v-3M16 19v-3" },
  { href: "/voitures", key: "cars", d: "M5 16l1.5-5h11L19 16M5 16h14v3H5zM7 19v1M17 19v1" },
  { href: "/activites", key: "activities", d: "M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" },
];

const sv = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const STEP_ICONS = [
  sv("M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5"),
  sv("M4 5h16v11H9l-5 4z"),
  sv("M6 8h12l1 12H5zM9 8a3 3 0 0 1 6 0"),
];

export default async function HomePage() {
  const { t, lang } = getT();
  const flights = await featuredFlights(6);
  return (
    <main id="main">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-bg" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/hero.jpg" width="1600" height="1000" alt="" fetchPriority="high" />
        </div>
        <div className="hero-contour" aria-hidden="true">
          <svg viewBox="0 0 700 600" preserveAspectRatio="xMidYMid slice">
            <path d="M40 560 C180 500 300 540 400 470 C520 388 600 430 700 360" />
            <path d="M60 500 C200 448 300 480 410 415 C530 345 620 380 700 300" />
            <path d="M90 442 C220 396 320 420 420 360 C540 292 640 322 700 246" />
            <path d="M140 388 C250 348 350 366 440 312 C560 248 660 272 700 202" />
            <path d="M200 336 C300 302 380 314 460 268 C570 208 680 226 700 160" />
          </svg>
        </div>
        <div className="wrap">
          <div className="hero-inner">
            <span className="hero-tag">{t("home.tag")}</span>
            <h1 id="hero-title">{t("home.h1a")} <em>{t("home.h1b")}</em></h1>
            <p className="hero-sub">{t("home.sub")}</p>
            <SearchTabs
              label={t("home.servicesTitle")}
              panels={[
                { key: "flights", label: t("nav.flights"), icon: SERVICES[0].d, node: <Finder /> },
                { key: "hotels", label: t("nav.hotels"), icon: SERVICES[1].d, node: <HotelSearch /> },
                { key: "transports", label: t("nav.transports"), icon: SERVICES[2].d, node: <TransportSearch /> },
                { key: "cars", label: t("nav.cars"), icon: SERVICES[3].d, node: <CarSearch /> },
                { key: "activities", label: t("nav.activities"), icon: SERVICES[4].d, node: <ActivitySearch /> },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="stats-band" aria-label={t("home.commitments")}>
        <div className="wrap">
          <div className="stats-row">
            <div className="stat-cell"><div className="n"><span className="val">3</span></div><span className="l">{t("home.stat1")}</span></div>
            <div className="stat-cell"><div className="n"><span className="val">3</span><span className="suffix"> {t("home.stat2suffix")}</span></div><span className="l">{t("home.stat2")}</span></div>
            <div className="stat-cell"><div className="n"><span className="val">24</span><span className="suffix"> h</span></div><span className="l">{t("home.stat3")}</span></div>
            <div className="stat-cell"><div className="n"><span className="val">100</span><span className="suffix">%</span></div><span className="l">{t("home.stat4")}</span></div>
          </div>
        </div>
      </section>

      <section className="section how" aria-labelledby="how-title">
        <div className="wrap">
          <div className="how-head">
            <span className="eyebrow">{t("home.how")}</span>
            <h2 className="h-sec" id="how-title" style={{ maxWidth: "none" }}>{t("home.howTitle")}</h2>
          </div>
          <div className="steps">
            {STEPS.map((n) => (
              <article className="step" key={n}>
                <div className="step-num">{STEP_ICONS[n - 1]}<span className="idx">{n}</span></div>
                <h3>{t(`home.step${n}.title`)}</h3>
                <p>{t(`home.step${n}.text`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="services-title" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <span className="eyebrow">{t("home.services")}</span>
          <h2 className="h-sec" id="services-title" style={{ maxWidth: "none", marginBottom: "1.75rem" }}>{t("home.servicesTitle")}</h2>
          <div className="services">
            {SERVICES.map((sv2) => (
              <Link key={sv2.key} href={sv2.href} className="service">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={sv2.d} /></svg>
                {t(`nav.${sv2.key}`)}
                <small>{t(`home.svc.${sv2.key}`)}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section tours" id="vols" aria-labelledby="tours-title">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">{t("home.next")}</span>
              <h2 className="h-sec" id="tours-title">{t("home.nextTitle")}</h2>
            </div>
            <p className="lead">{t("home.nextLead")}</p>
          </div>
          {flights.length === 0 ? (
            <p className="muted">{t("home.noFlights")}</p>
          ) : (
            <div className="tours-grid">
              {flights.map((f) => (
                <article className="tour" key={f.id}>
                  <div className="tour-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cityImg(f.toCity)} alt={f.toCity} loading="lazy" />
                    <div className="tour-route" aria-hidden="true">
                      <span>{f.fromAirport}</span><span className="plane">✈</span><span>{f.toAirport}</span>
                    </div>
                  </div>
                  <div className="tour-body">
                    <div className="tour-meta">
                      <span>{formatDuration(f.departAt, f.arriveAt)}</span>
                      <span>{f.stops === 0 ? t("flight.direct") : (f.stops === 1 ? t("flight.stops1") : t("flight.stopsN", { n: f.stops }))}</span>
                      <span>{t("common.seatsLeft", { n: f.seatsAvailable })}</span>
                    </div>
                    <h3>{f.fromCity} → {f.toCity}</h3>
                    <p className="airline-line"><AirlineBadge name={f.airline} logo={f.airlineLogo} size={22} />{f.airline} · {formatDateTime(f.departAt, lang)}</p>
                    {f.stops > 0 && <p className="stopline">{parseLayovers(f.layovers).map((l) => l.place).join(" · ")}</p>}
                    <div className="tour-foot">
                      <div className="tour-price"><span className="from">{t("common.from")}</span><span className="amt">{price(f.price, f.currency)}</span></div>
                      <Link href={`/vols/${f.id}`} className="tour-book">{t("common.book")} →</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          <p style={{ marginTop: "2rem" }}><Link className="btn btn-ghost" href="/vols">{t("home.allFlights")}</Link></p>
        </div>
      </section>

      <section className="section" aria-label={lang === "en" ? "Our premises and partners" : "Nos locaux et partenaires"}>
        <div className="wrap">
          <div className="agency-gallery" style={{ marginTop: 0 }}>
            <h2>{lang === "en" ? "Our premises" : "Nos locaux"}</h2>
            <div className="agency-gallery-grid">
              {["devanture", "agence-1", "agence-2", "agence-4", "agence-5", "agence-6"].map((n) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={n} src={`/img/site/${n}.jpg`} alt="Travel's Affair" loading="lazy" width="800" height="599" />
              ))}
            </div>
          </div>
          <Partners lang={lang} />
        </div>
      </section>
    </main>
  );
}
