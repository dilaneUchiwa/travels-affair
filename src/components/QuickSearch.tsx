import { getT } from "@/i18n/server";
import { placeSuggestions } from "@/modules/catalog/places";
import { PlaceInput, type PlaceOption } from "./PlaceInput";

const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-5.7 7-11a7 7 0 10-14 0c0 5.3 7 11 7 11z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" /></svg>
);
const CalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M4 10h16M9 3v4M15 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
);

type Field = { name: string; label: string; placeholder?: string; type?: "text" | "date"; options?: PlaceOption[] };

/** Formulaire de recherche d'un service : mêmes champs et mêmes paramètres que la page du service (GET). */
function Form({ action, fields, aria }: { action: string; fields: Field[]; aria: string }) {
  const { t } = getT();
  return (
    <form className="finder" action={action} method="get" aria-label={aria}>
      {fields.map((f) => (
        <div className="finder-field" key={f.name}>
          <label htmlFor={`q-${action}-${f.name}`}>{f.type === "date" ? <CalIcon /> : <PinIcon />} {f.label}</label>
          {f.type === "date" ? (
            <input id={`q-${action}-${f.name}`} name={f.name} type="date" />
          ) : (
            <PlaceInput id={`q-${action}-${f.name}`} name={f.name} placeholder={f.placeholder} options={f.options ?? []} />
          )}
        </div>
      ))}
      <div className="finder-submit">
        <button type="submit" className="btn btn-arrow">{t("common.search")}</button>
      </div>
    </form>
  );
}

export async function HotelSearch() {
  const { t } = getT();
  const places = await placeSuggestions("hotel");
  return <Form action="/hotels" aria={t("nav.hotels")} fields={[{ name: "q", label: t("hotel.q"), placeholder: t("hotel.qPh"), options: places }]} />;
}

export async function TransportSearch() {
  const { t } = getT();
  const [from, to] = await Promise.all([placeSuggestions("transportFrom"), placeSuggestions("transportTo")]);
  return <Form action="/transports" aria={t("nav.transports")} fields={[
    { name: "from", label: t("transport.from"), options: from },
    { name: "to", label: t("transport.to"), options: to },
    { name: "date", label: t("flight.date"), type: "date" },
  ]} />;
}

export async function CarSearch() {
  const { t } = getT();
  const places = await placeSuggestions("car");
  return <Form action="/voitures" aria={t("nav.cars")} fields={[
    { name: "location", label: t("car.location"), placeholder: t("car.locationPh"), options: places },
    { name: "pickup", label: t("detail.pickup"), type: "date" },
    { name: "ret", label: t("detail.return"), type: "date" },
  ]} />;
}

export async function ActivitySearch() {
  const { t } = getT();
  const places = await placeSuggestions("activity");
  return <Form action="/activites" aria={t("nav.activities")} fields={[
    { name: "q", label: t("activity.q"), placeholder: t("activity.qPh"), options: places },
    { name: "date", label: t("flight.date"), type: "date" },
  ]} />;
}
