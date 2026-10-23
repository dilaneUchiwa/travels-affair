import "server-only";
import { desc, eq, inArray, sql } from "drizzle-orm";
import {
  activities, airlines, bookings, contactMessages, db, faqItems, flights, hotelProperties, hotels, pages, transportProviders,
  transports, vehicleBrands, vehicleCategories, vehicleModels, vehicles,
} from "@/db";
import { parsePhotos } from "@/modules/uploads/service";
import { formatDateTime } from "@/shared/dates";
import { invalid } from "@/shared/errors";
import { formatMoney } from "@/shared/money";
import type { Entity, Field, Opt } from "./types";

const STATUS: Opt[] = [{ value: "DRAFT", label: "Brouillon" }, { value: "PUBLISHED", label: "Publié" }];
const statusField = (extra: Opt[] = []): Field => ({ kind: "select", name: "status", label: "Statut", options: [...STATUS, ...extra], defaultValue: "DRAFT" });
const photos = (label = "Photos"): Field => ({ kind: "photos", name: "photos", label, wide: true });
const statusLabel = (s: string) => ({ DRAFT: "Brouillon", PUBLISHED: "Publié", MAINTENANCE: "Maintenance" })[s] ?? s;
const lines = (s: string) => s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

const countBookings = (type: string, ids: string[]) =>
  ids.length === 0
    ? Promise.resolve(0)
    : db.select({ n: sql<number>`count(*)` }).from(bookings).where(sql`${bookings.serviceType} = ${type} and ${inArray(bookings.itemId, ids)}`).then((r) => Number(r[0]?.n ?? 0));

const hotelOptions = async (): Promise<Opt[]> => (await db.select().from(hotels).orderBy(hotels.name)).map((h) => ({ value: h.id, label: `${h.name} (${h.city})` }));
const airlineOptions = async (): Promise<Opt[]> => (await db.select().from(airlines).orderBy(airlines.name)).map((a) => ({ value: a.id, label: `${a.name}${a.code ? ` (${a.code})` : ""}` }));
const providerOptions = async (): Promise<Opt[]> => (await db.select().from(transportProviders).orderBy(transportProviders.name)).map((p) => ({ value: p.id, label: p.name }));
const brandOptions = async (): Promise<Opt[]> => (await db.select().from(vehicleBrands).orderBy(vehicleBrands.name)).map((b) => ({ value: b.id, label: b.name }));
const categoryOptions = async (): Promise<Opt[]> => (await db.select().from(vehicleCategories).orderBy(vehicleCategories.name)).map((c) => ({ value: c.id, label: c.name }));
const modelOptions = async (): Promise<Opt[]> =>
  (await db.query.vehicleModels.findMany({ with: { brand: true } })).map((m) => ({ value: m.id, label: `${m.brand.name} ${m.name}` })).sort((a, b) => a.label.localeCompare(b.label));

export const ENTITIES: Entity[] = [
  {
    key: "vols", table: flights, title: "Vols", singular: "vol", group: "offers", publishable: true, bookingType: "FLIGHT",
    columns: ["Trajet", "Compagnie", "Départ", "Prix", "Places"],
    fields: [
      { kind: "relation", name: "airlineId", label: "Compagnie aérienne", required: true, load: airlineOptions, help: "Gérée dans Référentiels → Compagnies aériennes (nom + logo)" },
      { kind: "select", name: "tripType", label: "Type de vol", options: [{ value: "ONE_WAY", label: "Aller simple" }, { value: "ROUND_TRIP", label: "Aller-retour" }, { value: "MULTI_CITY", label: "Multi-destinations" }], defaultValue: "ONE_WAY" },
      { kind: "text", name: "fromCity", label: "Ville de départ", suggest: "city", required: true },
      { kind: "text", name: "fromAirport", label: "Aéroport de départ (code)", suggest: "airport", required: true, help: "Ex. DLA" },
      { kind: "text", name: "toCity", label: "Ville d'arrivée", suggest: "city", required: true },
      { kind: "text", name: "toAirport", label: "Aéroport d'arrivée (code)", suggest: "airport", required: true, help: "Ex. CDG" },
      { kind: "datetime", name: "departAt", label: "Départ", required: true },
      { kind: "datetime", name: "arriveAt", label: "Arrivée", required: true },
      { kind: "datetime", name: "returnDepartAt", label: "Retour : départ", help: "Aller-retour uniquement" },
      { kind: "datetime", name: "returnArriveAt", label: "Retour : arrivée", help: "Aller-retour uniquement" },
      { kind: "textarea", name: "itinerary", label: "Tronçons (multi-destinations)", wide: true, help: "Un tronçon par ligne, ex. « DLA → CDG, 12/12 22:00 »" },
      { kind: "textarea", name: "layovers", label: "Escales (une par ligne)", wide: true, help: "Laisser vide pour un vol direct. Format : Ville (CODE) | durée — ex. « Istanbul (IST) | 2 h 10 »" },
      { kind: "text", name: "baggage", label: "Franchise bagages", required: true, help: "Ex. 1 bagage 23 kg" },
      { kind: "currency", name: "currency", label: "Devise" },
      { kind: "number", name: "price", label: "Prix par passager", min: 1, required: true },
      { kind: "number", name: "seatsAvailable", label: "Places disponibles", min: 0, max: 1000, required: true },
      { kind: "textarea", name: "description", label: "Description", wide: true },
      { kind: "textarea", name: "conditions", label: "Conditions de réservation", wide: true },
      { kind: "textarea", name: "cancellationPolicy", label: "Conditions d'annulation", wide: true },
      photos("Photos de la destination"),
      statusField(),
    ],
    async beforeSave(d) {
      const [a] = await db.select().from(airlines).where(eq(airlines.id, String(d.airlineId)));
      if (!a) throw invalid("Compagnie aérienne introuvable.");
      d.airline = a.name;
      d.stops = lines(String(d.layovers ?? "")).length;
    },
    refine(d) {
      const dep = d.departAt as Date, arr = d.arriveAt as Date;
      if (arr <= dep) throw invalid("L'arrivée doit être postérieure au départ.");
      if (d.tripType === "ROUND_TRIP") {
        const rd = d.returnDepartAt as Date | null, ra = d.returnArriveAt as Date | null;
        if (!rd || !ra) throw invalid("Un aller-retour exige les dates du vol retour.");
        if (rd <= arr || ra <= rd) throw invalid("Le retour doit partir après l'arrivée de l'aller et arriver après son départ.");
      }
      if (d.tripType === "MULTI_CITY" && lines(String(d.itinerary ?? "")).length < 2) throw invalid("Multi-destinations : indiquez au moins deux tronçons (un par ligne).");
    },
    rows: async () =>
      (await db.select().from(flights).orderBy(desc(flights.departAt))).map((f) => ({
        id: f.id, published: f.status === "PUBLISHED",
        cells: [`${f.fromAirport} → ${f.toAirport} (${f.fromCity} → ${f.toCity})`, f.airline, formatDateTime(f.departAt), formatMoney(f.price, f.currency), String(f.seatsAvailable)],
      })),
    bookingsCount: (id) => countBookings("FLIGHT", [id]),
  },
  {
    key: "hotels", table: hotels, title: "Hébergements", singular: "établissement", group: "offers", publishable: true,
    columns: ["Établissement", "Catégorie", "Étoiles", "Ville"],
    fields: [
      { kind: "text", name: "name", label: "Nom de l'établissement", required: true },
      { kind: "select", name: "category", label: "Catégorie", options: [{ value: "HOTEL", label: "Hôtel" }, { value: "RESIDENCE", label: "Résidence" }, { value: "LODGE", label: "Lodge" }, { value: "APARTMENT", label: "Appartement" }, { value: "GUESTHOUSE", label: "Maison d'hôtes" }], defaultValue: "HOTEL" },
      { kind: "number", name: "stars", label: "Étoiles", min: 1, max: 5, defaultValue: 3, required: true },
      { kind: "text", name: "country", label: "Pays", suggest: "country", required: true },
      { kind: "text", name: "city", label: "Ville", suggest: "city", required: true },
      { kind: "text", name: "address", label: "Adresse" },
      { kind: "text", name: "amenities", label: "Commodités de l'établissement", wide: true, help: "Séparées par des virgules : Wi-Fi, Piscine, Parking" },
      { kind: "textarea", name: "description", label: "Description", wide: true },
      { kind: "textarea", name: "conditions", label: "Conditions de réservation", wide: true },
      { kind: "textarea", name: "cancellationPolicy", label: "Conditions d'annulation", wide: true },
      photos(),
      statusField(),
    ],
    rows: async () => (await db.select().from(hotels).orderBy(hotels.name)).map((h) => ({ id: h.id, published: h.status === "PUBLISHED", cells: [h.name, h.category, "★".repeat(h.stars), `${h.city}, ${h.country}`] })),
    bookingsCount: async (id) => countBookings("HOTEL", (await db.select({ id: hotelProperties.id }).from(hotelProperties).where(eq(hotelProperties.hotelId, id))).map((p) => p.id)),
  },
  {
    key: "biens", table: hotelProperties, title: "Biens (chambres, suites…)", singular: "bien", group: "offers", publishable: true, bookingType: "HOTEL",
    columns: ["Bien", "Établissement", "Capacité", "Unités", "Prix / nuit"],
    fields: [
      { kind: "relation", name: "hotelId", label: "Établissement", required: true, load: hotelOptions },
      { kind: "text", name: "name", label: "Nom du bien", required: true, help: "Ex. Chambre double deluxe" },
      { kind: "number", name: "capacity", label: "Personnes par unité", min: 1, max: 20, defaultValue: 2, required: true },
      { kind: "number", name: "quantity", label: "Nombre d'unités disponibles", min: 0, max: 500, defaultValue: 1, required: true },
      { kind: "textarea", name: "roomsDetail", label: "Pièces du bien", wide: true, help: "Une pièce par ligne : « Chambre — 1 lit king », « Salle de bain »…" },
      { kind: "text", name: "amenities", label: "Commodités du bien", wide: true, help: "Séparées par des virgules : Climatisation, TV, Minibar" },
      { kind: "currency", name: "currency", label: "Devise" },
      { kind: "number", name: "pricePerNight", label: "Prix par nuit et par unité", min: 1, required: true },
      photos(),
      statusField(),
    ],
    rows: async () =>
      (await db.query.hotelProperties.findMany({ with: { hotel: true } })).map((p) => ({ id: p.id, published: p.status === "PUBLISHED", cells: [p.name, p.hotel.name, String(p.capacity), String(p.quantity), formatMoney(p.pricePerNight, p.currency)] })),
    bookingsCount: (id) => countBookings("HOTEL", [id]),
  },
  {
    key: "compagnies", table: airlines, title: "Compagnies aériennes", singular: "compagnie", group: "catalog", publishable: false,
    columns: ["Compagnie", "Code", "Pays", "Logo"],
    fields: [
      { kind: "text", name: "name", label: "Nom de la compagnie", required: true },
      { kind: "text", name: "code", label: "Code IATA", help: "Ex. AF, ET, TK" },
      { kind: "text", name: "country", label: "Pays", suggest: "country" },
      { kind: "photos", name: "logo", label: "Logo", wide: true, help: "PNG/JPEG/WebP, fond transparent conseillé" },
    ],
    rows: async () => (await db.select().from(airlines).orderBy(airlines.name)).map((a) => ({ id: a.id, cells: [a.name, a.code, a.country, parsePhotos(a.logo)[0] ? "✓" : "—"] })),
    bookingsCount: async (id) => Number((await db.select({ n: sql<number>`count(*)` }).from(flights).where(eq(flights.airlineId, id)))[0]?.n ?? 0),
  },
  {
    key: "prestataires", table: transportProviders, title: "Compagnies et prestataires de transport", singular: "prestataire", group: "catalog", publishable: false,
    columns: ["Nom", "Contact"],
    fields: [
      { kind: "text", name: "name", label: "Nom", required: true },
      { kind: "text", name: "contact", label: "Contact (téléphone, e-mail)" },
      { kind: "textarea", name: "description", label: "Description", wide: true },
    ],
    rows: async () => (await db.select().from(transportProviders).orderBy(transportProviders.name)).map((p) => ({ id: p.id, cells: [p.name, p.contact] })),
  },
  {
    key: "transports", table: transports, title: "Transports", singular: "trajet", group: "offers", publishable: true, bookingType: "TRANSPORT",
    columns: ["Trajet", "Mode", "Prestataire", "Départ", "Prix", "Places"],
    fields: [
      { kind: "relation", name: "providerId", label: "Compagnie / prestataire", required: true, load: providerOptions },
      { kind: "select", name: "mode", label: "Type de transport", options: [{ value: "BUS", label: "Bus" }, { value: "TRAIN", label: "Train" }, { value: "SHUTTLE", label: "Navette / transfert" }], defaultValue: "SHUTTLE" },
      { kind: "text", name: "fromPlace", label: "Lieu de départ", suggest: "place", required: true, help: "Ex. Aéroport de Douala" },
      { kind: "text", name: "toPlace", label: "Lieu d'arrivée", suggest: "place", required: true, help: "Ex. Hôtel, gare, aéroport" },
      { kind: "datetime", name: "departAt", label: "Départ", required: true },
      { kind: "datetime", name: "arriveAt", label: "Arrivée", required: true },
      { kind: "text", name: "driverName", label: "Chauffeur (éventuel)" },
      { kind: "currency", name: "currency", label: "Devise" },
      { kind: "number", name: "price", label: "Prix par personne", min: 1, required: true },
      { kind: "number", name: "seatsAvailable", label: "Places disponibles", min: 0, max: 1000, required: true },
      { kind: "textarea", name: "accessConditions", label: "Conditions d'accès", wide: true },
      { kind: "textarea", name: "description", label: "Description", wide: true },
      photos(),
      statusField(),
    ],
    refine: (d) => { if ((d.arriveAt as Date) <= (d.departAt as Date)) throw invalid("L'arrivée doit être postérieure au départ."); },
    rows: async () =>
      (await db.query.transports.findMany({ with: { provider: true }, orderBy: desc(transports.departAt) })).map((t) => ({ id: t.id, published: t.status === "PUBLISHED", cells: [`${t.fromPlace} → ${t.toPlace}`, t.mode, t.provider.name, formatDateTime(t.departAt), formatMoney(t.price, t.currency), String(t.seatsAvailable)] })),
    bookingsCount: (id) => countBookings("TRANSPORT", [id]),
  },
  {
    key: "marques", table: vehicleBrands, title: "Marques de véhicules", singular: "marque", group: "catalog", publishable: false,
    columns: ["Marque"], fields: [{ kind: "text", name: "name", label: "Marque", required: true }],
    rows: async () => (await db.select().from(vehicleBrands).orderBy(vehicleBrands.name)).map((b) => ({ id: b.id, cells: [b.name] })),
  },
  {
    key: "modeles", table: vehicleModels, title: "Modèles de véhicules", singular: "modèle", group: "catalog", publishable: false,
    columns: ["Modèle", "Marque"],
    fields: [
      { kind: "relation", name: "brandId", label: "Marque", required: true, load: brandOptions },
      { kind: "text", name: "name", label: "Modèle", required: true },
    ],
    rows: async () => (await db.query.vehicleModels.findMany({ with: { brand: true } })).map((m) => ({ id: m.id, cells: [m.name, m.brand.name] })),
  },
  {
    key: "categories", table: vehicleCategories, title: "Catégories de véhicules", singular: "catégorie", group: "catalog", publishable: false,
    columns: ["Catégorie"], fields: [{ kind: "text", name: "name", label: "Catégorie", required: true, help: "Ex. Citadine, Berline, SUV, Minibus" }],
    rows: async () => (await db.select().from(vehicleCategories).orderBy(vehicleCategories.name)).map((c) => ({ id: c.id, cells: [c.name] })),
  },
  {
    key: "vehicules", table: vehicles, title: "Locations de véhicules", singular: "véhicule", group: "offers", publishable: true, bookingType: "CAR",
    columns: ["Véhicule", "Catégorie", "Lieu", "Places", "Prix / jour", "Statut"],
    fields: [
      { kind: "relation", name: "modelId", label: "Marque et modèle", required: true, load: modelOptions },
      { kind: "relation", name: "categoryId", label: "Catégorie", required: true, load: categoryOptions },
      { kind: "text", name: "location", label: "Localisation du véhicule", suggest: "place", required: true, help: "Ex. Douala — Aéroport" },
      { kind: "number", name: "seats", label: "Nombre de places", min: 1, max: 60, defaultValue: 5, required: true },
      { kind: "number", name: "units", label: "Véhicules identiques disponibles", min: 1, max: 100, defaultValue: 1, required: true },
      { kind: "currency", name: "currency", label: "Devise" },
      { kind: "number", name: "pricePerDay", label: "Prix par jour", min: 1, required: true },
      { kind: "text", name: "amenities", label: "Commodités", wide: true, help: "Séparées par des virgules : Climatisation, GPS, Boîte automatique" },
      { kind: "textarea", name: "conditions", label: "Conditions de location", wide: true },
      photos(),
      statusField([{ value: "MAINTENANCE", label: "En maintenance (non réservable)" }]),
    ],
    rows: async () =>
      (await db.query.vehicles.findMany({ with: { model: { with: { brand: true } }, category: true } })).map((v) => ({ id: v.id, published: v.status === "PUBLISHED", cells: [`${v.model.brand.name} ${v.model.name}`, v.category.name, v.location, String(v.seats), formatMoney(v.pricePerDay, v.currency), statusLabel(v.status)] })),
    bookingsCount: (id) => countBookings("CAR", [id]),
  },
  {
    key: "activites", table: activities, title: "Activités et excursions", singular: "activité", group: "offers", publishable: true, bookingType: "ACTIVITY",
    columns: ["Activité", "Lieu", "Début", "Prix", "Places"],
    fields: [
      { kind: "text", name: "title", label: "Titre", required: true },
      { kind: "text", name: "country", label: "Pays", suggest: "country", required: true },
      { kind: "text", name: "city", label: "Ville", suggest: "city", required: true },
      { kind: "datetime", name: "startAt", label: "Début", required: true },
      { kind: "number", name: "durationHours", label: "Durée (heures)", min: 1, max: 240, defaultValue: 2, required: true },
      { kind: "currency", name: "currency", label: "Devise" },
      { kind: "number", name: "price", label: "Prix par participant", min: 1, required: true },
      { kind: "number", name: "placesAvailable", label: "Places disponibles", min: 0, max: 1000, required: true },
      { kind: "textarea", name: "description", label: "Description", wide: true },
      { kind: "textarea", name: "conditions", label: "Conditions", wide: true },
      { kind: "textarea", name: "cancellationPolicy", label: "Conditions d'annulation", wide: true },
      photos(),
      statusField(),
    ],
    rows: async () => (await db.select().from(activities).orderBy(desc(activities.startAt))).map((a) => ({ id: a.id, published: a.status === "PUBLISHED", cells: [a.title, `${a.city}, ${a.country}`, formatDateTime(a.startAt), formatMoney(a.price, a.currency), String(a.placesAvailable)] })),
    bookingsCount: (id) => countBookings("ACTIVITY", [id]),
  },
  {
    key: "pages", table: pages, idColumn: "slug", title: "Pages d'information", singular: "page", group: "content", publishable: false, noCreate: true, noDelete: true,
    columns: ["Page", "Titre (FR)", "Titre (EN)"],
    fields: [
      { kind: "text", name: "titleFr", label: "Titre (français)", required: true },
      { kind: "text", name: "titleEn", label: "Titre (anglais)", required: true },
      { kind: "textarea", name: "bodyFr", label: "Contenu (français)", wide: true, help: "Paragraphes séparés par une ligne vide ; une ligne commençant par « ## » devient un sous-titre." },
      { kind: "textarea", name: "bodyEn", label: "Contenu (anglais)", wide: true },
    ],
    rows: async () => (await db.select().from(pages).orderBy(pages.slug)).map((p) => ({ id: p.slug, cells: [p.slug, p.titleFr, p.titleEn] })),
  },
  {
    key: "faq", table: faqItems, title: "Foire aux questions", singular: "question", group: "content", publishable: false,
    columns: ["Ordre", "Question (FR)"],
    fields: [
      { kind: "number", name: "position", label: "Ordre d'affichage", min: 0, max: 999, defaultValue: 0, required: true },
      { kind: "text", name: "questionFr", label: "Question (français)", required: true, wide: true },
      { kind: "textarea", name: "answerFr", label: "Réponse (français)", required: true, wide: true },
      { kind: "text", name: "questionEn", label: "Question (anglais)", wide: true },
      { kind: "textarea", name: "answerEn", label: "Réponse (anglais)", wide: true },
    ],
    rows: async () => (await db.select().from(faqItems).orderBy(faqItems.position)).map((q) => ({ id: q.id, cells: [String(q.position), q.questionFr] })),
  },
  {
    key: "messages", table: contactMessages, title: "Messages de contact", singular: "message", group: "content", publishable: false, noCreate: true,
    columns: ["Date", "De", "Sujet", "Traité"],
    fields: [
      { kind: "text", name: "name", label: "Nom", required: true },
      { kind: "text", name: "email", label: "E-mail", required: true },
      { kind: "text", name: "subject", label: "Sujet", required: true, wide: true },
      { kind: "textarea", name: "message", label: "Message", required: true, wide: true },
      { kind: "select", name: "handled", label: "Traité", options: [{ value: "0", label: "Non" }, { value: "1", label: "Oui" }], defaultValue: "0", asBoolean: true },
    ],
    rows: async () => (await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt))).map((m) => ({ id: m.id, cells: [formatDateTime(m.createdAt), `${m.name} <${m.email}>`, m.subject, m.handled ? "Oui" : "Non"] })),
  },
];

export const getEntity = (key: string) => ENTITIES.find((e) => e.key === key);

export const GROUPS: { id: Entity["group"]; label: string }[] = [
  { id: "offers", label: "Offres" },
  { id: "catalog", label: "Référentiels" },
  { id: "content", label: "Contenus" },
];
