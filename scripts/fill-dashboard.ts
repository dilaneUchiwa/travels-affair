/**
 * fill-dashboard.ts — Inserts 3 months of realistic bookings + payments
 * into the travelair MySQL DB so the admin dashboard shows meaningful stats.
 * Run: npx dotenv -e .env -- npx tsx scripts/fill-dashboard.ts
 */
import {
  activities, bookings, db, flights, hotelProperties, hotels, passengers,
  payments, transports, users, vehicles,
} from "../src/db";
import { eq } from "drizzle-orm";

const DAY = 86_400_000;
const uuid = () => crypto.randomUUID();

function daysAgo(n: number, hourOffset = 0): Date {
  return new Date(Date.now() - n * DAY + hourOffset * 3_600_000);
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const BOOKING_STATUSES = [
  "PAID", "PAID", "PAID", "PAID",          // 40 % paid
  "CONFIRMED", "CONFIRMED", "CONFIRMED",    // 30 % confirmed
  "AWAITING_CONFIRMATION",                   // 10 %
  "CANCELLED",                               // 10 %
  "PENDING_PAYMENT",                         // 10 %
];

const PAYMENT_METHODS = ["CARD", "ORANGE_MONEY", "MTN_MOMO", "PAYPAL"];

async function main() {
  // ---- Load existing catalogue items
  const [allUsers, allFlights, allHotels, allProps, allTransports, allVehicles, allActivities] =
    await Promise.all([
      db.select({ id: users.id }).from(users).where(eq(users.role, "CLIENT")),
      db.select({ id: flights.id, price: flights.price, currency: flights.currency, fromCity: flights.fromCity, toCity: flights.toCity }).from(flights),
      db.select({ id: hotels.id, name: hotels.name }).from(hotels),
      db.select({ id: hotelProperties.id, hotelId: hotelProperties.hotelId, pricePerNight: hotelProperties.pricePerNight, currency: hotelProperties.currency }).from(hotelProperties),
      db.select({ id: transports.id, price: transports.price, currency: transports.currency, fromPlace: transports.fromPlace, toPlace: transports.toPlace }).from(transports),
      db.select({ id: vehicles.id, pricePerDay: vehicles.pricePerDay, currency: vehicles.currency, location: vehicles.location }).from(vehicles),
      db.select({ id: activities.id, price: activities.price, currency: activities.currency, title: activities.title }).from(activities),
    ]);

  if (!allUsers.length) { console.error("No CLIENT users found — run seed first."); process.exit(1); }

  const hotelMap = Object.fromEntries(allHotels.map((h) => [h.id, h.name]));

  const TOTAL = 120; // bookings to insert
  const bookingRows: (typeof bookings.$inferInsert)[] = [];
  const passengerRows: (typeof passengers.$inferInsert)[] = [];
  const paymentRows: (typeof payments.$inferInsert)[] = [];

  for (let i = 0; i < TOTAL; i++) {
    const dayOffset = randInt(0, 90);
    const createdAt = daysAgo(dayOffset, randInt(6, 22));
    const status = pick(BOOKING_STATUSES);
    const userId = pick(allUsers).id;
    const bookingId = uuid();

    // Pick service type weighted
    const roll = Math.random();
    let serviceType: string;
    let itemId: string;
    let title: string;
    let subtitle = "";
    let startAt: Date;
    let endAt: Date;
    let unitPrice: number;
    let multiplier = 1;
    let quantity = 1;
    let currency = "XAF";

    if (roll < 0.35 && allFlights.length) {
      serviceType = "FLIGHT";
      const f = pick(allFlights);
      itemId = f.id;
      title = `Vol ${f.fromCity} → ${f.toCity}`;
      quantity = randInt(1, 3);
      unitPrice = f.price;
      currency = f.currency;
      startAt = daysAgo(dayOffset - randInt(1, 14), randInt(4, 20));
      endAt = new Date(startAt.getTime() + randInt(2, 12) * 3_600_000);
    } else if (roll < 0.55 && allProps.length) {
      serviceType = "HOTEL";
      const p = pick(allProps);
      itemId = p.id;
      const hotelName = hotelMap[p.hotelId] ?? "Hôtel";
      title = hotelName;
      subtitle = "Chambre standard";
      multiplier = randInt(1, 7);
      quantity = 1;
      unitPrice = p.pricePerNight;
      currency = p.currency;
      startAt = daysAgo(dayOffset - randInt(1, 10), 14);
      endAt = new Date(startAt.getTime() + multiplier * DAY);
    } else if (roll < 0.70 && allVehicles.length) {
      serviceType = "CAR";
      const v = pick(allVehicles);
      itemId = v.id;
      title = `Location véhicule — ${v.location}`;
      multiplier = randInt(1, 5);
      quantity = 1;
      unitPrice = v.pricePerDay;
      currency = v.currency;
      startAt = daysAgo(dayOffset - randInt(1, 10), 9);
      endAt = new Date(startAt.getTime() + multiplier * DAY);
    } else if (roll < 0.83 && allTransports.length) {
      serviceType = "TRANSPORT";
      const t = pick(allTransports);
      itemId = t.id;
      title = `Transport ${t.fromPlace} → ${t.toPlace}`;
      quantity = randInt(1, 4);
      unitPrice = t.price;
      currency = t.currency;
      startAt = daysAgo(dayOffset - randInt(1, 7), randInt(5, 18));
      endAt = new Date(startAt.getTime() + randInt(1, 8) * 3_600_000);
    } else if (allActivities.length) {
      serviceType = "ACTIVITY";
      const a = pick(allActivities);
      itemId = a.id;
      title = a.title;
      quantity = randInt(1, 5);
      unitPrice = a.price;
      currency = a.currency;
      startAt = daysAgo(dayOffset - randInt(1, 7), 9);
      endAt = new Date(startAt.getTime() + 4 * 3_600_000);
    } else {
      // fallback to flight even if empty
      continue;
    }

    const total = unitPrice * quantity * multiplier;
    const ref = `TA-${Date.now().toString(36).toUpperCase()}-${uuid().slice(0, 6).toUpperCase()}`;

    bookingRows.push({
      id: bookingId,
      reference: ref,
      userId,
      serviceType,
      itemId,
      title,
      subtitle,
      startAt,
      endAt,
      details: "[]",
      conditions: "",
      cancellationPolicy: "",
      status,
      quantity,
      multiplier,
      unitPrice,
      total,
      currency,
      remindersSent: "",
      createdAt,
    });

    // Passengers for flights
    if (serviceType === "FLIGHT") {
      for (let p = 0; p < quantity; p++) {
        passengerRows.push({ id: uuid(), bookingId, fullName: `Passager ${p + 1} (réservation ${ref})` });
      }
    }

    // Payment for paid/confirmed bookings
    if (["PAID", "CONFIRMED", "AWAITING_CONFIRMATION"].includes(status)) {
      paymentRows.push({
        id: uuid(),
        bookingId,
        method: pick(PAYMENT_METHODS),
        provider: "SIMULATED",
        amount: total,
        currency,
        status: "SUCCEEDED",
        providerReference: `SIM-${uuid().slice(0, 8).toUpperCase()}`,
        createdAt,
      });
    } else if (status === "CANCELLED") {
      // cancelled bookings may have a failed payment attempt
      if (Math.random() > 0.4) {
        paymentRows.push({
          id: uuid(),
          bookingId,
          method: pick(PAYMENT_METHODS),
          provider: "SIMULATED",
          amount: total,
          currency,
          status: "FAILED",
          failureReason: "Annulé par le client",
          createdAt,
        });
      }
    }
  }

  console.log(`Inserting ${bookingRows.length} bookings, ${passengerRows.length} passengers, ${paymentRows.length} payments…`);

  // Insert in batches of 50 to avoid packet size issues
  const chunk = <T>(arr: T[], size: number) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

  for (const batch of chunk(bookingRows, 50)) {
    await db.insert(bookings).values(batch);
  }
  for (const batch of chunk(passengerRows, 50)) {
    await db.insert(passengers).values(batch);
  }
  for (const batch of chunk(paymentRows, 50)) {
    await db.insert(payments).values(batch);
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
