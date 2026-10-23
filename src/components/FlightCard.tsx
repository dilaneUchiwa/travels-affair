import Link from "next/link";
import { AirlineBadge } from "@/components/AirlineBadge";
import type { FlightView } from "@/modules/flights/repository";
import { parseLayovers } from "@/shared/layovers";
import { getT } from "@/i18n/server";
import { formatDateTime, formatDuration } from "@/shared/dates";
import { price, priceOthers } from "@/shared/price";

export function FlightCard({ flight }: { flight: FlightView }) {
  const { t, lang } = getT();
  return (
    <article className="card flight">
      <div>
        <div className="route">
          <div><div className="city">{flight.fromCity}</div><div className="code">{flight.fromAirport}</div></div>
          <div className="line"><small>{formatDuration(flight.departAt, flight.arriveAt)}</small></div>
          <div><div className="city">{flight.toCity}</div><div className="code">{flight.toAirport}</div></div>
        </div>
        {flight.stops > 0 && (
          <p className="stopline">{(flight.stops === 1 ? t("flight.stops1") : t("flight.stopsN", { n: flight.stops }))} · {parseLayovers(flight.layovers).map((l) => (l.duration ? `${l.place} (${l.duration})` : l.place)).join(" · ")}</p>
        )}
        <div className="meta">
          <span className="airline-line"><AirlineBadge name={flight.airline} logo={flight.airlineLogo} size={24} />{flight.airline}</span>
          <span>{t("flight.departure")} {formatDateTime(flight.departAt, lang)}</span>
          <span>{flight.stops === 0 ? t("flight.direct") : (flight.stops === 1 ? t("flight.stops1") : t("flight.stopsN", { n: flight.stops }))}</span>
          <span>{flight.baggage}</span>
          <span>{t("common.seatsLeft", { n: flight.seatsAvailable })}</span>
          {flight.returnDepartAt && <span>{t("flight.roundTrip")}</span>}
        </div>
      </div>
      <div className="price">
        <strong>{price(flight.price, flight.currency)}</strong>
        <small>≈ {priceOthers(flight.price, flight.currency)}</small>
        <div style={{ marginTop: ".6rem" }}><Link className="btn small" href={`/vols/${flight.id}`}>{t("common.book")}</Link></div>
      </div>
    </article>
  );
}
