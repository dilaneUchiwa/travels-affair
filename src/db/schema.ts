// Schéma MySQL (production, base gérée Aiven). Les identifiants sont des UUID générés côté application.
// Les statuts sont des chaînes validées dans la couche domaine (modules/**/status.ts).
// Note MySQL : les colonnes TEXT ne peuvent pas porter de DEFAULT ; on utilise $defaultFn (défaut appliqué par Drizzle à l'insertion).
import { relations } from "drizzle-orm";
import { boolean, index, int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

const id = () => varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID());
const fk = (name: string) => varchar(name, { length: 36 });
const createdAt = () => timestamp("created_at").notNull().defaultNow();

export const users = mysqlTable("users", {
  id: id(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 16 }).notNull().default("CLIENT"), // CLIENT | ADMIN
  lang: varchar("lang", { length: 8 }).notNull().default("fr"), // fr | en (langue des e-mails)
  createdAt: createdAt(),
});

export const passwordResets = mysqlTable("password_resets", {
  id: id(),
  userId: fk("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(), // seul le hachage SHA-256 est stocké
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: createdAt(),
});

/** Compagnies aériennes (référentiel administrable, logo téléversé). */
export const airlines = mysqlTable("airlines", {
  id: id(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 16 }).notNull().default(""), // code IATA, ex. AF
  country: varchar("country", { length: 128 }).notNull().default(""),
  logo: text("logo").notNull().$defaultFn(() => "[]"), // JSON : URL du logo (première entrée)
  createdAt: createdAt(),
});

/** Configuration modifiable depuis l'administration (clé → valeur texte). */
export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 191 }).primaryKey(),
  value: text("value").notNull(),
});

export const flights = mysqlTable(
  "flights",
  {
    id: id(),
    airline: varchar("airline", { length: 255 }).notNull(), // nom de la compagnie (copie de airlines.name)
    airlineId: fk("airline_id").references(() => airlines.id),
    layovers: text("layovers").notNull().$defaultFn(() => ""), // une escale par ligne : « Ville (CODE) | durée »
    fromCity: varchar("from_city", { length: 255 }).notNull(),
    fromAirport: varchar("from_airport", { length: 16 }).notNull(),
    toCity: varchar("to_city", { length: 255 }).notNull(),
    toAirport: varchar("to_airport", { length: 16 }).notNull(),
    tripType: varchar("trip_type", { length: 16 }).notNull().default("ONE_WAY"), // ONE_WAY | ROUND_TRIP | MULTI_CITY
    departAt: timestamp("depart_at").notNull(),
    arriveAt: timestamp("arrive_at").notNull(),
    stops: int("stops").notNull().default(0),
    baggage: varchar("baggage", { length: 255 }).notNull(),
    currency: varchar("currency", { length: 8 }).notNull(), // XAF | EUR | USD
    price: int("price").notNull(), // par passager, unité entière de la devise
    seatsAvailable: int("seats_available").notNull(),
    conditions: text("conditions").notNull().$defaultFn(() => ""),
    cancellationPolicy: text("cancellation_policy").notNull().$defaultFn(() => ""),
    description: text("description").notNull().$defaultFn(() => ""),
    photos: text("photos").notNull().$defaultFn(() => "[]"), // JSON : URLs des photos de la compagnie
    returnDepartAt: timestamp("return_depart_at"), // aller-retour
    returnArriveAt: timestamp("return_arrive_at"),
    itinerary: text("itinerary").notNull().$defaultFn(() => ""), // multi-destinations : un tronçon par ligne
    status: varchar("status", { length: 16 }).notNull().default("DRAFT"), // DRAFT | PUBLISHED
    createdAt: createdAt(),
  },
  (t) => ({ statusDepart: index("flights_status_depart_idx").on(t.status, t.departAt) }),
);

/**
 * Réservation générique : l'offre réservée est « photographiée » (titre, dates, détails, prix)
 * au moment de la réservation, ce qui rend documents, e-mails et historique indépendants des modifications ultérieures de l'offre.
 */
export const bookings = mysqlTable(
  "bookings",
  {
    id: id(),
    reference: varchar("reference", { length: 64 }).notNull().unique(),
    userId: fk("user_id").notNull().references(() => users.id),
    serviceType: varchar("service_type", { length: 16 }).notNull().default("FLIGHT"), // FLIGHT | HOTEL | TRANSPORT | CAR | ACTIVITY
    itemId: fk("item_id").notNull(), // id de l'offre dans sa table
    title: varchar("title", { length: 255 }).notNull(),
    subtitle: varchar("subtitle", { length: 255 }).notNull().default(""),
    startAt: timestamp("start_at").notNull(),
    endAt: timestamp("end_at").notNull(),
    details: text("details").notNull().$defaultFn(() => "[]"), // JSON : [[libellé, valeur], …]
    conditions: text("conditions").notNull().$defaultFn(() => ""),
    cancellationPolicy: text("cancellation_policy").notNull().$defaultFn(() => ""),
    status: varchar("status", { length: 32 }).notNull().default("PENDING_PAYMENT"),
    quantity: int("quantity").notNull(), // places, chambres, véhicules ou participants
    multiplier: int("multiplier").notNull().default(1), // nuits (hôtel) ou jours (location) ; 1 sinon
    unitPrice: int("unit_price").notNull(), // prix unitaire instantané (par place, par nuit, par jour…) ; total = unitPrice × quantity × multiplier
    total: int("total").notNull(),
    currency: varchar("currency", { length: 8 }).notNull(),
    remindersSent: varchar("reminders_sent", { length: 255 }).notNull().default(""), // minutes déjà envoyées, séparées par des virgules
    createdAt: createdAt(),
  },
  (t) => ({
    byUser: index("bookings_user_idx").on(t.userId),
    byStatus: index("bookings_status_idx").on(t.status, t.createdAt),
    byItem: index("bookings_item_idx").on(t.serviceType, t.itemId, t.startAt),
  }),
);

export const passengers = mysqlTable("passengers", {
  id: id(),
  bookingId: fk("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
});

export const payments = mysqlTable("payments", {
  id: id(),
  bookingId: fk("booking_id").notNull().references(() => bookings.id),
  method: varchar("method", { length: 32 }).notNull(), // CARD | PAYPAL | ORANGE_MONEY | MTN_MOMO
  provider: varchar("provider", { length: 32 }).notNull().default("SIMULATED"), // SIMULATED | STRIPE | PAYPAL | CAMPAY
  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 8 }).notNull(),
  status: varchar("status", { length: 16 }).notNull(), // PENDING | SUCCEEDED | FAILED
  providerReference: varchar("provider_reference", { length: 255 }),
  failureReason: text("failure_reason"),
  createdAt: createdAt(),
});

const status = () => varchar("status", { length: 16 }).notNull().default("DRAFT"); // DRAFT | PUBLISHED (| MAINTENANCE pour les véhicules)
const photos = () => text("photos").notNull().$defaultFn(() => "[]"); // JSON : URLs

export const hotels = mysqlTable("hotels", {
  id: id(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 32 }).notNull().default("HOTEL"), // HOTEL | RESIDENCE | LODGE | APARTMENT | GUESTHOUSE
  stars: int("stars").notNull().default(3),
  country: varchar("country", { length: 128 }).notNull(),
  city: varchar("city", { length: 128 }).notNull(),
  address: varchar("address", { length: 255 }).notNull().default(""),
  description: text("description").notNull().$defaultFn(() => ""),
  amenities: text("amenities").notNull().$defaultFn(() => ""), // commodités, séparées par des virgules
  conditions: text("conditions").notNull().$defaultFn(() => ""),
  cancellationPolicy: text("cancellation_policy").notNull().$defaultFn(() => ""),
  photos: photos(),
  status: status(),
  createdAt: createdAt(),
});

/** « Bien » d'un établissement (chambre double, suite, villa…) : N unités identiques, avec ses pièces et commodités. */
export const hotelProperties = mysqlTable("hotel_properties", {
  id: id(),
  hotelId: fk("hotel_id").notNull().references(() => hotels.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  capacity: int("capacity").notNull().default(2), // personnes par unité
  quantity: int("quantity").notNull().default(1), // nombre d'unités de ce bien
  roomsDetail: text("rooms_detail").notNull().$defaultFn(() => ""), // pièces du bien, une par ligne
  amenities: text("amenities").notNull().$defaultFn(() => ""),
  currency: varchar("currency", { length: 8 }).notNull(),
  pricePerNight: int("price_per_night").notNull(),
  photos: photos(),
  status: status(),
  createdAt: createdAt(),
});

export const transportProviders = mysqlTable("transport_providers", {
  id: id(),
  name: varchar("name", { length: 255 }).notNull(),
  contact: varchar("contact", { length: 128 }).notNull().default(""),
  description: text("description").notNull().$defaultFn(() => ""),
  createdAt: createdAt(),
});

export const transports = mysqlTable("transports", {
  id: id(),
  providerId: fk("provider_id").notNull().references(() => transportProviders.id),
  mode: varchar("mode", { length: 16 }).notNull().default("SHUTTLE"), // BUS | TRAIN | SHUTTLE
  fromPlace: varchar("from_place", { length: 255 }).notNull(),
  toPlace: varchar("to_place", { length: 255 }).notNull(),
  departAt: timestamp("depart_at").notNull(),
  arriveAt: timestamp("arrive_at").notNull(),
  driverName: varchar("driver_name", { length: 255 }).notNull().default(""), // chauffeur éventuel (navettes, transferts)
  accessConditions: text("access_conditions").notNull().$defaultFn(() => ""),
  currency: varchar("currency", { length: 8 }).notNull(),
  price: int("price").notNull(), // par personne
  seatsAvailable: int("seats_available").notNull(),
  description: text("description").notNull().$defaultFn(() => ""),
  photos: photos(),
  status: status(),
  createdAt: createdAt(),
});

export const vehicleBrands = mysqlTable("vehicle_brands", { id: id(), name: varchar("name", { length: 191 }).notNull().unique() });
export const vehicleCategories = mysqlTable("vehicle_categories", { id: id(), name: varchar("name", { length: 191 }).notNull().unique() });
export const vehicleModels = mysqlTable("vehicle_models", {
  id: id(),
  brandId: fk("brand_id").notNull().references(() => vehicleBrands.id),
  name: varchar("name", { length: 191 }).notNull(),
});

export const vehicles = mysqlTable("vehicles", {
  id: id(),
  modelId: fk("model_id").notNull().references(() => vehicleModels.id),
  categoryId: fk("category_id").notNull().references(() => vehicleCategories.id),
  location: varchar("location", { length: 255 }).notNull(),
  seats: int("seats").notNull().default(5),
  units: int("units").notNull().default(1), // véhicules identiques disponibles
  currency: varchar("currency", { length: 8 }).notNull(),
  pricePerDay: int("price_per_day").notNull(),
  amenities: text("amenities").notNull().$defaultFn(() => ""),
  conditions: text("conditions").notNull().$defaultFn(() => ""),
  photos: photos(),
  status: status(), // DRAFT | PUBLISHED | MAINTENANCE
  createdAt: createdAt(),
});

export const activities = mysqlTable("activities", {
  id: id(),
  title: varchar("title", { length: 255 }).notNull(),
  country: varchar("country", { length: 128 }).notNull(),
  city: varchar("city", { length: 128 }).notNull(),
  startAt: timestamp("start_at").notNull(),
  durationHours: int("duration_hours").notNull().default(2),
  currency: varchar("currency", { length: 8 }).notNull(),
  price: int("price").notNull(), // par participant
  placesAvailable: int("places_available").notNull(),
  description: text("description").notNull().$defaultFn(() => ""),
  conditions: text("conditions").notNull().$defaultFn(() => ""),
  cancellationPolicy: text("cancellation_policy").notNull().$defaultFn(() => ""),
  photos: photos(),
  status: status(),
  createdAt: createdAt(),
});

/** Contenus d'information administrables (agence, informations pratiques…), bilingues. */
export const pages = mysqlTable("pages", {
  slug: varchar("slug", { length: 191 }).primaryKey(),
  titleFr: varchar("title_fr", { length: 255 }).notNull(),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  bodyFr: text("body_fr").notNull().$defaultFn(() => ""),
  bodyEn: text("body_en").notNull().$defaultFn(() => ""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const faqItems = mysqlTable("faq_items", {
  id: id(),
  position: int("position").notNull().default(0),
  questionFr: varchar("question_fr", { length: 512 }).notNull(),
  answerFr: text("answer_fr").notNull(),
  questionEn: varchar("question_en", { length: 512 }).notNull().default(""),
  answerEn: text("answer_en").notNull().$defaultFn(() => ""),
});

export const contactMessages = mysqlTable("contact_messages", {
  id: id(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  handled: boolean("handled").notNull().default(false),
  createdAt: createdAt(),
});

export const emailLogs = mysqlTable("email_logs", {
  id: id(),
  bookingId: fk("booking_id").references(() => bookings.id),
  to: varchar("to", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  delivered: boolean("delivered").notNull().default(false),
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
