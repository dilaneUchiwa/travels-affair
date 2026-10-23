import { getT } from "@/i18n/server";
import { placeSuggestions } from "@/modules/catalog/places";
import { PlaceInput } from "./PlaceInput";

const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-5.7 7-11a7 7 0 10-14 0c0 5.3 7 11 7 11z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" /></svg>
);
const CalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M4 10h16M9 3v4M15 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
);

type Values = { from?: string; to?: string; date?: string };

/** Formulaire de recherche de vols (structure « Find a trip » de Compass), en GET vers /vols. */
export async function Finder({ values = {}, compact = false }: { values?: Values; compact?: boolean }) {
  const { t } = getT();
  const [fromOpts, toOpts] = await Promise.all([placeSuggestions("flightFrom"), placeSuggestions("flightTo")]);
  return (
    <form className={`finder${compact ? " compact" : ""}`} action="/vols" method="get" aria-label={t("flight.searchLabel")}>
      <div className="finder-field">
        <label htmlFor="f-from"><PinIcon /> {t("flight.from")}</label>
        <PlaceInput id="f-from" name="from" defaultValue={values.from} placeholder={t("flight.fromPh")} options={fromOpts} />
      </div>
      <div className="finder-field">
        <label htmlFor="f-to"><PinIcon /> {t("flight.to")}</label>
        <PlaceInput id="f-to" name="to" defaultValue={values.to} placeholder={t("flight.toPh")} options={toOpts} />
      </div>
      <div className="finder-field">
        <label htmlFor="f-date"><CalIcon /> {t("flight.date")}</label>
        <input id="f-date" name="date" type="date" defaultValue={values.date} />
      </div>
      <div className="finder-submit">
        <button type="submit" className="btn btn-arrow">
          {t("common.search")}
          <span className="btn-arrow"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
        </button>
      </div>
    </form>
  );
}
