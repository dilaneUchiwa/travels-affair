import "server-only";
import { eq } from "drizzle-orm";
import { activities, airlines, db, flights, hotels, transports, vehicles } from "@/db";
import type { SuggestKind } from "./types";

export type Place = { value: string; hint?: string };
export type PlaceKind = "flightFrom" | "flightTo" | "hotel" | "transportFrom" | "transportTo" | "car" | "activity";

const uniq = (list: Place[]) => {
  const seen = new Map<string, Place>();
  for (const p of list) {
    const k = p.value.trim().toLowerCase();
    if (p.value.trim() && !seen.has(k)) seen.set(k, { ...p, value: p.value.trim() });
  }
  return [...seen.values()].sort((a, b) => a.value.localeCompare(b.value, "fr"));
};

/** Suggestions de saisie : uniquement des lieux présents dans les offres publiées par l'agence (back-office). */
export async function placeSuggestions(kind: PlaceKind): Promise<Place[]> {
  switch (kind) {
    case "flightFrom":
    case "flightTo": {
      const rows = await db.select({ fc: flights.fromCity, fa: flights.fromAirport, tc: flights.toCity, ta: flights.toAirport }).from(flights).where(eq(flights.status, "PUBLISHED"));
      // On propose toutes les villes desservies (départ ou arrivée) : le client peut chercher dans les deux sens.
      return uniq(rows.flatMap((r) => [{ value: r.fc, hint: r.fa }, { value: r.tc, hint: r.ta }]));
    }
    case "hotel": {
      const rows = await db.select({ city: hotels.city, country: hotels.country, name: hotels.name }).from(hotels).where(eq(hotels.status, "PUBLISHED"));
      return uniq([...rows.map((r) => ({ value: r.city, hint: r.country })), ...rows.map((r) => ({ value: r.name, hint: r.city }))]);
    }
    case "transportFrom":
    case "transportTo": {
      const rows = await db.select({ f: transports.fromPlace, t: transports.toPlace }).from(transports).where(eq(transports.status, "PUBLISHED"));
      return uniq(rows.flatMap((r) => [{ value: r.f }, { value: r.t }]));
    }
    case "car": {
      const rows = await db.select({ l: vehicles.location }).from(vehicles).where(eq(vehicles.status, "PUBLISHED"));
      return uniq(rows.map((r) => ({ value: r.l })));
    }
    case "activity": {
      const rows = await db.select({ city: activities.city, country: activities.country, title: activities.title }).from(activities).where(eq(activities.status, "PUBLISHED"));
      return uniq([...rows.map((r) => ({ value: r.city, hint: r.country })), ...rows.map((r) => ({ value: r.title, hint: r.city }))]);
    }
  }
}

// Référentiel de départ (Afrique ↔ Europe) pour que l'admin ait des suggestions même sur une base vide ; les valeurs déjà saisies s'y ajoutent.
const CITIES: [string, string, string][] = [
  ["Douala", "DLA", "Cameroun"], ["Yaoundé", "NSI", "Cameroun"], ["Garoua", "GOU", "Cameroun"], ["Maroua", "MVR", "Cameroun"], ["Bafoussam", "BFX", "Cameroun"], ["Bertoua", "BTA", "Cameroun"],
  ["Kribi", "", "Cameroun"], ["Limbé", "", "Cameroun"], ["Bamenda", "BPC", "Cameroun"], ["Paris", "CDG", "France"], ["Lyon", "LYS", "France"], ["Marseille", "MRS", "France"], ["Bruxelles", "BRU", "Belgique"],
  ["Londres", "LHR", "Royaume-Uni"], ["Casablanca", "CMN", "Maroc"], ["Istanbul", "IST", "Turquie"], ["Addis-Abeba", "ADD", "Éthiopie"], ["Dubaï", "DXB", "Émirats arabes unis"], ["Doha", "DOH", "Qatar"],
  ["Abidjan", "ABJ", "Côte d'Ivoire"], ["Dakar", "DSS", "Sénégal"], ["Libreville", "LBV", "Gabon"], ["Brazzaville", "BZV", "Congo"], ["Kinshasa", "FIH", "RD Congo"], ["Lagos", "LOS", "Nigeria"],
  ["Accra", "ACC", "Ghana"], ["Nairobi", "NBO", "Kenya"], ["Kigali", "KGL", "Rwanda"], ["Le Caire", "CAI", "Égypte"], ["Tunis", "TUN", "Tunisie"], ["Alger", "ALG", "Algérie"],
  ["Francfort", "FRA", "Allemagne"], ["Amsterdam", "AMS", "Pays-Bas"], ["Madrid", "MAD", "Espagne"], ["Rome", "FCO", "Italie"], ["Genève", "GVA", "Suisse"], ["Vienne", "VIE", "Autriche"],
  ["Lisbonne", "LIS", "Portugal"], ["Montréal", "YUL", "Canada"], ["New York", "JFK", "États-Unis"], ["Washington", "IAD", "États-Unis"],
];
const COUNTRIES = [...new Set(CITIES.map((c) => c[2]))];

/** Suggestions pour les champs du back-office : référentiel + valeurs déjà saisies dans les offres. */
export async function adminSuggestions(kind: SuggestKind): Promise<Place[]> {
  const [fl, ho, ac, tr, ve, al] = await Promise.all([
    db.select({ fc: flights.fromCity, fa: flights.fromAirport, tc: flights.toCity, ta: flights.toAirport }).from(flights),
    db.select({ city: hotels.city, country: hotels.country }).from(hotels),
    db.select({ city: activities.city, country: activities.country }).from(activities),
    db.select({ f: transports.fromPlace, t: transports.toPlace }).from(transports),
    db.select({ l: vehicles.location }).from(vehicles),
    db.select({ country: airlines.country }).from(airlines),
  ]);
  switch (kind) {
    case "city":
      return uniq([...CITIES.map(([v, , h]) => ({ value: v, hint: h })), ...fl.flatMap((r) => [{ value: r.fc }, { value: r.tc }]), ...ho.map((r) => ({ value: r.city, hint: r.country })), ...ac.map((r) => ({ value: r.city, hint: r.country }))]);
    case "country":
      return uniq([...COUNTRIES.map((v) => ({ value: v })), ...ho.map((r) => ({ value: r.country })), ...ac.map((r) => ({ value: r.country })), ...al.map((r) => ({ value: r.country ?? "" }))]);
    case "airport":
      return uniq([...CITIES.filter((c) => c[1]).map(([city, code]) => ({ value: code, hint: city })), ...fl.flatMap((r) => [{ value: r.fa }, { value: r.ta }])]);
    case "place":
      return uniq([...CITIES.flatMap(([city]) => [{ value: `Aéroport de ${city}`, hint: "Aéroport" }]), ...tr.flatMap((r) => [{ value: r.f }, { value: r.t }]), ...ve.map((r) => ({ value: r.l }))]);
  }
}
