// Schéma SQLite (démo, zéro installation). Pour PostgreSQL en production :
// remplacer drizzle-orm/sqlite-core par drizzle-orm/pg-core et le client dans src/db/index.ts.
// Les statuts sont des chaînes validées dans la couche domaine (modules/**/status.ts).
import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
  integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`);

export const users = sqliteTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("CLIENT"), // CLIENT | ADMIN
  lang: text("lang").notNull().default("fr"), // fr | en (langue des e-mails)
  createdAt: createdAt(),
});

export const passwordResets = sqliteTable("password_resets", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(), // seul le hachage SHA-256 est stocké
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  createdAt: createdAt(),
});

/** Compagnies aériennes (référentiel administrable, logo téléversé). */
export const airlines = sqliteTable("airlines", {
  id: id(),
  name: text("name").notNull(),
  code: text("code").notNull().default(""), // code IATA, ex. AF
  country: text("country").notNull().default(""),
  logo: text("logo").notNull().default("[]"), // JSON : URL du logo (première entrée)
  createdAt: createdAt(),
});

/** Configuration modifiable depuis l'administration (clé → valeur texte). */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const flights = sqliteTable(
  "flights",
  {
    id: id(),
    airline: text("airline").notNull(), // nom de la compagnie (copie de airlines.name)
    airlineId: text("airline_id").references(() => airlines.id),
    layovers: text("layovers").notNull().default(""), // une escale par ligne : « Ville (CODE) | durée »
    fromCity: text("from_city").notNull(),
    fromAirport: text("from_airport").notNull(),
    toCity: text("to_city").notNull(),
    toAirport: text("to_airport").notNull(),
    tripType: text("trip_type").notNull().default("ONE_WAY"), // ONE_WAY | ROUND_TRIP | MULTI_CITY
    departAt: integer("depart_at", { mode: "timestamp" }).notNull(),
    arriveAt: integer("arrive_at", { mode: "timestamp" }).notNull(),
    stops: integer("stops").notNull().default(0),
    baggage: text("baggage").notNull(),
    currency: text("currency").notNull(), // XAF | EUR | USD
    price: integer("price").notNull(), // par passager, unité entière de la devise
    seatsAvailable: integer("seats_available").notNull(),
    conditions: text("conditions").notNull().default(""),
    cancellationPolicy: text("cancellation_policy").notNull().default(""),
    description: text("description").notNull().default(""),
    photos: text("photos").notNull().default("[]"), // JSON : URLs des photos de la compagnie
    returnDepartAt: integer("return_depart_at", { mode: "timestamp" }), // aller-retour
    returnArriveAt: integer("return_arrive_at", { mode: "timestamp" }),
    itinerary: text("itinerary").notNull().default(""), // multi-destinations : un tronçon par ligne
    status: text("status").notNull().default("DRAFT"), // DRAFT | PUBLISHED
    createdAt: createdAt(),
  },
  (t) => ({ statusDepart: index("flights_status_depart_idx").on(t.status, t.departAt) }),
);

/**
 * Réservation générique : l'offre réservée est « photographiée » (titre, dates, détails, prix)
 * au moment de la réservation, ce qui rend documents, e-mails et historique indépendants des modifications ultérieures de l'offre.
 */
export const bookings = sqliteTable(
  "bookings",
  {
    id: id(),
    reference: text("reference").notNull().unique(),
    userId: text("user_id").notNull().references(() => users.id),
    serviceType: text("service_type").notNull().default("FLIGHT"), // FLIGHT | HOTEL | TRANSPORT | CAR | ACTIVITY
    itemId: text("item_id").notNull(), // id de l'offre dans sa table
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull().default(""),
    startAt: integer("start_at", { mode: "timestamp" }).notNull(),
    endAt: integer("end_at", { mode: "timestamp" }).notNull(),
    details: text("details").notNull().default("[]"), // JSON : [[libellé, valeur], …]
    conditions: text("conditions").notNull().default(""),
    cancellationPolicy: text("cancellation_policy").notNull().default(""),
    status: text("status").notNull().default("PENDING_PAYMENT"),
    quantity: integer("quantity").notNull(), // places, chambres, véhicules ou participants
    multiplier: integer("multiplier").notNull().default(1), // nuits (hôtel) ou jours (location) ; 1 sinon
    unitPrice: integer("unit_price").notNull(), // prix unitaire instantané (par place, par nuit, par jour…) ; total = unitPrice × quantity × multiplier
    total: integer("total").notNull(),
    currency: text("currency").notNull(),
    remindersSent: text("reminders_sent").notNull().default(""), // minutes déjà envoyées, séparées par des virgules
    createdAt: createdAt(),
  },
  (t) => ({
    byUser: index("bookings_user_idx").on(t.userId),
    byStatus: index("bookings_status_idx").on(t.status, t.createdAt),
    byItem: index("bookings_item_idx").on(t.serviceType, t.itemId, t.startAt),
  }),
);

export const passengers = sqliteTable("passengers", {
  id: id(),
  bookingId: text("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
});

export const payments = sqliteTable("payments", {
  id: id(),
  bookingId: text("booking_id").notNull().references(() => bookings.id),
  method: text("method").notNull(), // CARD | PAYPAL | ORANGE_MONEY | MTN_MOMO
  provider: text("provider").notNull().default("SIMULATED"), // SIMULATED | STRIPE | PAYPAL | CAMPAY
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull(), // PENDING | SUCCEEDED | FAILED
  providerReference: text("provider_reference"),
  failureReason: text("failure_reason"),
  createdAt: createdAt(),
});

const status = () => text("status").notNull().default("DRAFT"); // DRAFT | PUBLISHED (| MAINTENANCE pour les véhicules)
const photos = () => text("photos").notNull().default("[]"); // JSON : URLs

export const hotels = sqliteTable("hotels", {
  id: id(),
  name: text("name").notNull(),
  category: text("category").notNull().default("HOTEL"), // HOTEL | RESIDENCE | LODGE | APARTMENT | GUESTHOUSE
  stars: integer("stars").notNull().default(3),
  country: text("country").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull().default(""),
  description: text("description").notNull().default(""),
  amenities: text("amenities").notNull().default(""), // commodités, séparées par des virgules
  conditions: text("conditions").notNull().default(""),
  cancellationPolicy: text("cancellation_policy").notNull().default(""),
  photos: photos(),
  status: status(),
  createdAt: createdAt(),
});

/** « Bien » d'un établissement (chambre double, suite, villa…) : N unités identiques, avec ses pièces et commodités. */
export const hotelProperties = sqliteTable("hotel_properties", {
  id: id(),
  hotelId: text("hotel_id").notNull().references(() => hotels.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull().default(2), // personnes par unité
  quantity: integer("quantity").notNull().default(1), // nombre d'unités de ce bien
  roomsDetail: text("rooms_detail").notNull().default(""), // pièces du bien, une par ligne
  amenities: text("amenities").notNull().default(""),
  currency: text("currency").notNull(),
  pricePerNight: integer("price_per_night").notNull(),
  photos: photos(),
  status: status(),
  createdAt: createdAt(),
});

export const transportProviders = sqliteTable("transport_providers", {
  id: id(),
  name: text("name").notNull(),
  contact: text("contact").notNull().default(""),
  description: text("description").notNull().default(""),
  createdAt: createdAt(),
});

export const transports = sqliteTable("transports", {
  id: id(),
  providerId: text("provider_id").notNull().references(() => transportProviders.id),
  mode: text("mode").notNull().default("SHUTTLE"), // BUS | TRAIN | SHUTTLE
  fromPlace: text("from_place").notNull(),
  toPlace: text("to_place").notNull(),
  departAt: integer("depart_at", { mode: "timestamp" }).notNull(),
  arriveAt: integer("arrive_at", { mode: "timestamp" }).notNull(),
  driverName: text("driver_name").notNull().default(""), // chauffeur éventuel (navettes, transferts)
  accessConditions: text("access_conditions").notNull().default(""),
  currency: text("currency").notNull(),
  price: integer("price").notNull(), // par personne
  seatsAvailable: integer("seats_available").notNull(),
  description: text("description").notNull().default(""),
  photos: photos(),
  status: status(),
  createdAt: createdAt(),
});

export const vehicleBrands = sqliteTable("vehicle_brands", { id: id(), name: text("name").notNull().unique() });
export const vehicleCategories = sqliteTable("vehicle_categories", { id: id(), name: text("name").notNull().unique() });
export const vehicleModels = sqliteTable("vehicle_models", {
  id: id(),
  brandId: text("brand_id").notNull().references(() => vehicleBrands.id),
  name: text("name").notNull(),
});

export const vehicles = sqliteTable("vehicles", {
  id: id(),
  modelId: text("model_id").notNull().references(() => vehicleModels.id),
  categoryId: text("category_id").notNull().references(() => vehicleCategories.id),
  location: text("location").notNull(),
  seats: integer("seats").notNull().default(5),
  units: integer("units").notNull().default(1), // véhicules identiques disponibles
  currency: text("currency").notNull(),
  pricePerDay: integer("price_per_day").notNull(),
  amenities: text("amenities").notNull().default(""),
  conditions: text("conditions").notNull().default(""),
  photos: photos(),
  status: status(), // DRAFT | PUBLISHED | MAINTENANCE
  createdAt: createdAt(),
});

export const activities = sqliteTable("activities", {
  id: id(),
  title: text("title").notNull(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  startAt: integer("start_at", { mode: "timestamp" }).notNull(),
  durationHours: integer("duration_hours").notNull().default(2),
  currency: text("currency").notNull(),
  price: integer("price").notNull(), // par participant
  placesAvailable: integer("places_available").notNull(),
  description: text("description").notNull().default(""),
  conditions: text("conditions").notNull().default(""),
  cancellationPolicy: text("cancellation_policy").notNull().default(""),
  photos: photos(),
  status: status(),
  createdAt: createdAt(),
});

/** Contenus d'information administrables (agence, informations pratiques…), bilingues. */
export const pages = sqliteTable("pages", {
  slug: text("slug").primaryKey(),
  titleFr: text("title_fr").notNull(),
  titleEn: text("title_en").notNull(),
  bodyFr: text("body_fr").notNull().default(""),
  bodyEn: text("body_en").notNull().default(""),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const faqItems = sqliteTable("faq_items", {
  id: id(),
  position: integer("position").notNull().default(0),
  questionFr: text("question_fr").notNull(),
  answerFr: text("answer_fr").notNull(),
  questionEn: text("question_en").notNull().default(""),
  answerEn: text("answer_en").notNull().default(""),
});

export const contactMessages = sqliteTable("contact_messages", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  handled: integer("handled", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

export const emailLogs = sqliteTable("email_logs", {
  id: id(),
  bookingId: text("booking_id").references(() => bookings.id),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  delivered: integer("delivered", { mode: "boolean" }).notNull().default(false),
  error: text("error"),
  createdAt: createdAt(),
});

export const usersRelations = relations(users, ({ many }) => ({ bookings: many(bookings) }));
export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  passengers: many(passengers),
  payments: many(payments),
}));
export const hotelsRelations = relations(hotels, ({ many }) => ({ properties: many(hotelProperties) }));
export const hotelPropertiesRelations = relations(hotelProperties, ({ one }) => ({
  hotel: one(hotels, { fields: [hotelProperties.hotelId], references: [hotels.id] }),
}));
export const transportsRelations = relations(transports, ({ one }) => ({
  provider: one(transportProviders, { fields: [transports.providerId], references: [transportProviders.id] }),
}));
export const vehicleModelsRelations = relations(vehicleModels, ({ one }) => ({
  brand: one(vehicleBrands, { fields: [vehicleModels.brandId], references: [vehicleBrands.id] }),
}));
export const vehiclesRelations = relations(vehicles, ({ one }) => ({
  model: one(vehicleModels, { fields: [vehicles.modelId], references: [vehicleModels.id] }),
  category: one(vehicleCategories, { fields: [vehicles.categoryId], references: [vehicleCategories.id] }),
}));
export const passengersRelations = relations(passengers, ({ one }) => ({
  booking: one(bookings, { fields: [passengers.bookingId], references: [bookings.id] }),
}));
export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
}));

export type User = typeof users.$inferSelect;
export type Flight = typeof flights.$inferSelect;
export type Airline = typeof airlines.$inferSelect;
export type NewFlight = typeof flights.$inferInsert;
export type Hotel = typeof hotels.$inferSelect;
export type HotelProperty = typeof hotelProperties.$inferSelect;
export type Transport = typeof transports.$inferSelect;
export type TransportProvider = typeof transportProviders.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Passenger = typeof passengers.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type EmailLog = typeof emailLogs.$inferSelect;
