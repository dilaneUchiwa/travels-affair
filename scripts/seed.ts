import { existsSync } from "node:fs";
import bcrypt from "bcryptjs";
import {
  activities, airlines, db, faqItems, flights, hotelProperties, hotels, pages, transportProviders, transports, users,
  vehicleBrands, vehicleCategories, vehicleModels, vehicles,
} from "../src/db";

// Utilise la photo réelle (.jpg, téléchargée par `npm run photos`) si elle existe, sinon l'illustration .svg fournie.
const P = (...n: string[]) => JSON.stringify(n.map((x) => (existsSync(`public/img/p/${x}.jpg`) ? `/img/p/${x}.jpg` : `/img/p/${x}.svg`)));
const L = (x: string) => JSON.stringify([`/img/airlines/${x}.svg`]);
const H = 3_600_000, DAY = 24 * H;
const at = (days: number, hour: number) => {
  const d = new Date(Date.now() + days * DAY);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
};

async function main() {
  if ((await db.select({ id: flights.id }).from(flights).limit(1)).length > 0) {
    console.log("Des données existent déjà : seed ignoré (supprimez dev.db pour repartir de zéro).");
    return;
  }
  await db.insert(users).values([
    { email: "admin@travels-affair.com", name: "Administrateur", role: "ADMIN", passwordHash: await bcrypt.hash("Admin123!", 10) },
    { email: "demo@client.com", name: "Client Démo", role: "CLIENT", passwordHash: await bcrypt.hash("Client123!", 10) },
    { email: "client.en@demo.com", name: "English Client", role: "CLIENT", lang: "en", passwordHash: await bcrypt.hash("Client123!", 10) },
  ]).onConflictDoNothing();

  // ---- Compagnies aériennes (logos : monogrammes de démonstration, à remplacer par les logos officiels via l'admin)
  const al = Object.fromEntries((await db.insert(airlines).values([
    { name: "Air France", code: "AF", country: "France", logo: L("air-france") },
    { name: "Brussels Airlines", code: "SN", country: "Belgique", logo: L("brussels-airlines") },
    { name: "Royal Air Maroc", code: "AT", country: "Maroc", logo: L("royal-air-maroc") },
    { name: "Turkish Airlines", code: "TK", country: "Turquie", logo: L("turkish-airlines") },
    { name: "Ethiopian Airlines", code: "ET", country: "Éthiopie", logo: L("ethiopian") },
    { name: "Camair-Co", code: "QC", country: "Cameroun", logo: L("camair-co") },
  ]).returning()).map((a) => [a.name, a]));
  const A = (n: string) => ({ airline: n, airlineId: al[n].id });

  // ---- Vols
  const base = { tripType: "ONE_WAY", status: "PUBLISHED", conditions: "Pièce d'identité et passeport valides requis. Se présenter 3 h avant le départ.", cancellationPolicy: "Annulation gratuite jusqu'à 72 h avant le départ, ensuite 50 % de frais." };
  await db.insert(flights).values([
    { ...base, ...A("Air France"), fromCity: "Douala", fromAirport: "DLA", toCity: "Paris", toAirport: "CDG", departAt: at(14, 22), arriveAt: at(15, 6), stops: 0, baggage: "1 bagage 23 kg", currency: "EUR", price: 640, seatsAvailable: 24, photos: P("city-paris"), description: "Vol direct de nuit Douala – Paris Charles-de-Gaulle, avec repas et boissons inclus.\n\nArrivée tôt le matin à Roissy-Charles-de-Gaulle, avec accès direct au RER B vers le centre de Paris." },
    { ...base, ...A("Brussels Airlines"), tripType: "ROUND_TRIP", fromCity: "Yaoundé", fromAirport: "NSI", toCity: "Bruxelles", toAirport: "BRU", departAt: at(21, 21), arriveAt: at(22, 5), returnDepartAt: at(35, 10), returnArriveAt: at(35, 18), stops: 0, baggage: "2 bagages 23 kg", currency: "EUR", price: 1090, seatsAvailable: 30, photos: P("city-bruxelles"), description: "Aller-retour Yaoundé – Bruxelles, deux semaines de séjour. Vols directs à l'aller comme au retour." },
    { ...base, ...A("Royal Air Maroc"), fromCity: "Douala", fromAirport: "DLA", toCity: "Paris", toAirport: "CDG", departAt: at(9, 8), arriveAt: at(9, 19), stops: 1, layovers: "Casablanca (CMN) | 2 h 40", baggage: "1 bagage 23 kg", currency: "XAF", price: 395000, seatsAvailable: 18, photos: P("city-casablanca", "city-paris"), description: "Douala – Paris via Casablanca : une escale confortable à l'aéroport Mohammed V, avec correspondance dans le même terminal." },
    { ...base, ...A("Turkish Airlines"), tripType: "MULTI_CITY", fromCity: "Douala", fromAirport: "DLA", toCity: "Londres", toAirport: "LHR", departAt: at(30, 2), arriveAt: at(30, 14), stops: 1, layovers: "Istanbul (IST) | 3 h 15", baggage: "1 bagage 30 kg", currency: "USD", price: 720, seatsAvailable: 40, itinerary: "DLA → IST → LHR, aller dans 30 jours\nLHR → IST → DLA, retour 10 jours plus tard", photos: P("city-istanbul"), description: "Voyage multi-destinations Douala – Istanbul – Londres, avec escale à Istanbul à l'aller comme au retour." },
    { ...base, ...A("Ethiopian Airlines"), fromCity: "Yaoundé", fromAirport: "NSI", toCity: "Addis-Abeba", toAirport: "ADD", departAt: at(7, 6), arriveAt: at(7, 12), stops: 0, baggage: "1 bagage 23 kg", currency: "XAF", price: 310000, seatsAvailable: 12, photos: P("city-addis"), description: "Vol régional vers le hub d'Addis-Abeba, point de départ de nombreuses correspondances vers l'Asie et l'Afrique de l'Est." },
    { ...base, ...A("Air France"), fromCity: "Paris", fromAirport: "CDG", toCity: "Douala", toAirport: "DLA", departAt: at(28, 10), arriveAt: at(28, 18), stops: 0, baggage: "1 bagage 23 kg", currency: "EUR", price: 610, seatsAvailable: 22, photos: P("city-douala"), description: "Retour Paris – Douala en vol direct de jour." },
    { ...base, ...A("Turkish Airlines"), fromCity: "Douala", fromAirport: "DLA", toCity: "Bruxelles", toAirport: "BRU", departAt: at(18, 1), arriveAt: at(18, 16), stops: 2, layovers: "Istanbul (IST) | 2 h 05\nVienne (VIE) | 1 h 30", baggage: "1 bagage 23 kg", currency: "EUR", price: 520, seatsAvailable: 35, photos: P("city-bruxelles", "city-istanbul"), description: "Notre tarif le plus économique vers Bruxelles, avec deux escales (Istanbul puis Vienne)." },
  ]);

  // ---- Hébergements
  const [h1, h2, h3] = await db.insert(hotels).values([
    { name: "Hôtel Akwa Palace", photos: P("hotel-akwa", "city-douala"), category: "HOTEL", stars: 4, country: "Cameroun", city: "Douala", address: "Boulevard de la Liberté, Akwa", description: "Hôtel d'affaires au cœur d'Akwa, à 20 minutes de l'aéroport.", amenities: "Wi-Fi, Piscine, Restaurant, Navette aéroport", conditions: "Arrivée à partir de 14 h, départ avant 12 h. Pièce d'identité exigée.", cancellationPolicy: "Annulation gratuite jusqu'à 48 h avant l'arrivée.", status: "PUBLISHED" },
    { name: "Résidence Les Palmiers", photos: P("hotel-palmiers", "city-yaounde"), category: "RESIDENCE", stars: 3, country: "Cameroun", city: "Yaoundé", address: "Bastos, rue 1.839", description: "Appartements meublés et équipés dans le quartier calme de Bastos.", amenities: "Wi-Fi, Cuisine équipée, Parking, Sécurité 24 h", conditions: "Caution demandée à l'arrivée.", cancellationPolicy: "Annulation gratuite jusqu'à 72 h avant l'arrivée.", status: "PUBLISHED" },
    { name: "Hôtel Rive Gauche", photos: P("hotel-rive-gauche", "city-paris"), category: "HOTEL", stars: 3, country: "France", city: "Paris", address: "12 rue des Écoles, 75005", description: "Petit hôtel de charme à deux pas du Quartier latin.", amenities: "Wi-Fi, Petit-déjeuner, Ascenseur", conditions: "Taxe de séjour en sus.", cancellationPolicy: "Non remboursable moins de 7 jours avant l'arrivée.", status: "PUBLISHED" },
  ]).returning();
  await db.insert(hotelProperties).values([
    { hotelId: h1.id, name: "Chambre double deluxe", capacity: 2, quantity: 12, roomsDetail: "Chambre — 1 lit king\nSalle de bain — douche et baignoire", amenities: "Climatisation, TV, Minibar, Coffre-fort", currency: "XAF", pricePerNight: 85000, status: "PUBLISHED" },
    { hotelId: h1.id, name: "Suite junior", capacity: 3, quantity: 4, roomsDetail: "Chambre — 1 lit king\nSalon — canapé-lit\nSalle de bain", amenities: "Climatisation, TV, Minibar, Balcon", currency: "XAF", pricePerNight: 150000, status: "PUBLISHED" },
    { hotelId: h2.id, name: "Appartement 2 pièces", capacity: 4, quantity: 6, roomsDetail: "Chambre — 1 lit double\nSalon — canapé-lit\nCuisine équipée\nSalle de bain", amenities: "Climatisation, Wi-Fi, Lave-linge", currency: "XAF", pricePerNight: 60000, status: "PUBLISHED" },
    { hotelId: h3.id, name: "Chambre double", capacity: 2, quantity: 8, roomsDetail: "Chambre — 1 lit double\nSalle de bain", amenities: "Wi-Fi, TV", currency: "EUR", pricePerNight: 125, status: "PUBLISHED" },
  ]);

  // ---- Transports
  const [p1, p2] = await db.insert(transportProviders).values([
    { name: "Garanti Express", contact: "+237 6 90 00 00 01", description: "Transport interurbain Douala – Yaoundé." },
    { name: "Travel's Affair Transferts", contact: "+237 6 90 00 00 02", description: "Transferts aéroport avec chauffeur." },
  ]).returning();
  await db.insert(transports).values([
    { providerId: p1.id, mode: "BUS", photos: P("transport-bus"), fromPlace: "Douala — Gare routière de Bonabéri", toPlace: "Yaoundé — Mvan", departAt: at(3, 6), arriveAt: at(3, 10), currency: "XAF", price: 6500, seatsAvailable: 40, accessConditions: "Bagage en soute : 1 valise par personne.", description: "Bus climatisé, départ à l'heure.", status: "PUBLISHED" },
    { providerId: p1.id, mode: "TRAIN", photos: P("transport-train"), fromPlace: "Douala — Gare", toPlace: "Yaoundé — Gare", departAt: at(4, 7), arriveAt: at(4, 12), currency: "XAF", price: 8000, seatsAvailable: 120, description: "Train express Douala – Yaoundé.", status: "PUBLISHED" },
    { providerId: p2.id, mode: "SHUTTLE", photos: P("transport-shuttle"), fromPlace: "Aéroport de Douala", toPlace: "Hôtel Akwa Palace", departAt: at(14, 23), arriveAt: at(15, 0), driverName: "M. Nkoulou", currency: "XAF", price: 10000, seatsAvailable: 8, accessConditions: "Le chauffeur vous attend avec une pancarte à votre nom.", description: "Transfert privé depuis l'aéroport, à l'arrivée du vol Air France.", status: "PUBLISHED" },
  ]);

  // ---- Véhicules
  const [b1, b2] = await db.insert(vehicleBrands).values([{ name: "Toyota" }, { name: "Hyundai" }]).returning();
  const [c1, c2, c3] = await db.insert(vehicleCategories).values([{ name: "Citadine" }, { name: "SUV" }, { name: "Minibus" }]).returning();
  const [m1, m2, m3] = await db.insert(vehicleModels).values([
    { brandId: b1.id, name: "Yaris" }, { brandId: b1.id, name: "Land Cruiser" }, { brandId: b2.id, name: "H1 Minibus" },
  ]).returning();
  await db.insert(vehicles).values([
    { photos: P("car-yaris"), modelId: m1.id, categoryId: c1.id, location: "Douala — Aéroport", seats: 5, units: 3, currency: "XAF", pricePerDay: 30000, amenities: "Climatisation, Boîte manuelle", conditions: "Permis de plus de 3 ans, caution 150 000 FCFA, kilométrage 200 km/jour inclus.", status: "PUBLISHED" },
    { photos: P("car-landcruiser"), modelId: m2.id, categoryId: c2.id, location: "Yaoundé — Centre", seats: 7, units: 2, currency: "XAF", pricePerDay: 85000, amenities: "Climatisation, 4x4, GPS", conditions: "Permis de plus de 5 ans, caution 400 000 FCFA.", status: "PUBLISHED" },
    { photos: P("car-minibus"), modelId: m3.id, categoryId: c3.id, location: "Douala — Aéroport", seats: 12, units: 1, currency: "XAF", pricePerDay: 110000, amenities: "Climatisation, Bagages", conditions: "Chauffeur possible sur demande.", status: "PUBLISHED" },
  ]);

  // ---- Activités
  await db.insert(activities).values([
    { title: "Excursion aux chutes de la Lobé", photos: P("activity-lobe", "city-kribi"), country: "Cameroun", city: "Kribi", startAt: at(10, 7), durationHours: 8, currency: "XAF", price: 25000, placesAvailable: 14, description: "Journée à Kribi : chutes de la Lobé qui se jettent dans l'océan, pirogue et déjeuner de poisson frais.", conditions: "Prévoir chaussures de marche et maillot de bain.", cancellationPolicy: "Annulation gratuite jusqu'à 48 h avant.", status: "PUBLISHED" },
    { title: "Visite guidée de Paris à vélo", photos: P("activity-paris-velo"), country: "France", city: "Paris", startAt: at(16, 9), durationHours: 3, currency: "EUR", price: 35, placesAvailable: 10, description: "Les grands monuments de Paris à vélo, avec guide francophone.", conditions: "Vélo et casque fournis.", cancellationPolicy: "Annulation gratuite jusqu'à 24 h avant.", status: "PUBLISHED" },
  ]);

  // ---- Contenus administrables
  await db.insert(pages).values([
    {
      slug: "agence", titleFr: "L'agence Travel's Affair", titleEn: "About Travel's Affair",
      bodyFr: "Travel's Affair est une agence de voyage basée à Yaoundé, spécialisée dans les déplacements entre l'Afrique et l'Europe.\n\n## Notre mission\n\nSimplifier vos voyages : une seule plateforme pour vos vols, hébergements, transports, locations de voiture et activités, avec un paiement en ligne sécurisé et des documents clairs.\n\n## Nos engagements\n\nDes offres vérifiées par notre équipe, une facturation en francs CFA, euros ou dollars, et un accompagnement avant, pendant et après votre voyage.",
      bodyEn: "Travel's Affair is a travel agency based in Yaoundé, specialising in trips between Africa and Europe.\n\n## Our mission\n\nMake travel simple: one platform for your flights, accommodation, transport, car rental and activities, with secure online payment and clear documents.\n\n## Our commitments\n\nOffers checked by our team, billing in CFA francs, euros or dollars, and support before, during and after your trip.",
    },
    {
      slug: "infos-pratiques", titleFr: "Informations pratiques", titleEn: "Travel information",
      bodyFr: "## Documents de voyage\n\nVérifiez la validité de votre passeport (6 mois après le retour) et les conditions de visa de votre destination avant de réserver.\n\n## Bagages\n\nLa franchise bagages est indiquée sur chaque vol. Les dimensions et poids sont fixés par la compagnie aérienne.\n\n## À l'aéroport\n\nPrésentez-vous 3 heures avant un vol international. Présentez le QR code de votre document de réservation avec une pièce d'identité.\n\n## Santé\n\nLe vaccin contre la fièvre jaune est généralement exigé à l'entrée et à la sortie du Cameroun. Renseignez-vous avant votre départ.",
      bodyEn: "## Travel documents\n\nCheck that your passport is valid (6 months after your return) and your destination's visa rules before booking.\n\n## Baggage\n\nThe baggage allowance is shown on each flight. Dimensions and weight are set by the airline.\n\n## At the airport\n\nArrive 3 hours before an international flight. Show the QR code of your booking voucher with a photo ID.\n\n## Health\n\nA yellow fever vaccination is generally required to enter and leave Cameroon. Check before you travel.",
    },
  ]);
  await db.insert(faqItems).values([
    { position: 1, questionFr: "Comment réserver ?", answerFr: "Choisissez une offre, créez un compte ou connectez-vous, indiquez les voyageurs puis payez en ligne. Vous recevez un e-mail immédiatement.", questionEn: "How do I book?", answerEn: "Choose an offer, create an account or log in, enter the travellers, then pay online. You receive an email right away." },
    { position: 2, questionFr: "Quels moyens de paiement acceptez-vous ?", answerFr: "Orange Money, MTN Mobile Money, Express Union, cartes Visa et Mastercard, et PayPal. Les prix sont en FCFA, euros ou dollars.", questionEn: "Which payment methods do you accept?", answerEn: "Orange Money, MTN Mobile Money, Express Union, Visa and Mastercard, and PayPal. Prices are in CFA francs, euros or dollars." },
    { position: 3, questionFr: "Que se passe-t-il si je ne paie pas ?", answerFr: "Sans paiement dans les 30 minutes, la réservation est annulée automatiquement et les places sont libérées.", questionEn: "What happens if I don't pay?", answerEn: "Without payment within 30 minutes, the booking is cancelled automatically and the places are released." },
    { position: 4, questionFr: "Où trouver mes documents ?", answerFr: "Dans « Mon espace » : confirmation, récapitulatif, facture et document de réservation avec QR code, en PDF. Ils vous sont aussi envoyés par e-mail.", questionEn: "Where do I find my documents?", answerEn: "In \"My account\": confirmation, trip summary, invoice and booking voucher with QR code, as PDFs. They are also emailed to you." },
    { position: 5, questionFr: "Puis-je annuler ou modifier ma réservation ?", answerFr: "Les conditions d'annulation sont indiquées sur chaque offre. Contactez-nous pour toute modification ; notre équipe met à jour le statut de votre réservation.", questionEn: "Can I cancel or change my booking?", answerEn: "Cancellation conditions are shown on each offer. Contact us for any change; our team updates your booking status." },
  ]);
  console.log("Données de démonstration insérées.");
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
