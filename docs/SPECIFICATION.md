# Spécification & traçabilité du cahier des charges (V1.0)

| Exigence du cahier des charges | Réalisation | Statut |
|---|---|---|
| Site public : accueil, agence, vols, hôtels, transports, voitures, activités, contact, infos pratiques + FAQ | pages `(site)/*`, contenus CMS bilingues | Fait |
| Réservation + paiement | moteur de réservation générique (adapters), page de paiement | Fait |
| Espace client (connexion, inscription, mot de passe oublié, historique, documents) | `/mon-compte`, `/mot-de-passe-oublie`, PDF | Fait |
| Admin vols (type, escales, bagages, conditions, photos, statut…) | `/admin/vols` | Fait |
| Admin hôtels / biens / pièces / disponibilités / commodités | `/admin/hotels`, `/admin/biens` | Fait |
| Admin transports, prestataires, chauffeurs | `/admin/transports`, `/admin/prestataires` | Fait |
| Admin location : marques, modèles, catégories, véhicules, statuts | `/admin/marques`…`/admin/vehicules` | Fait |
| 7 statuts de réservation | `modules/bookings/status.ts` | Fait |
| Paiement Orange Money, MTN MoMo, Visa, Mastercard, PayPal, Stripe | adapters Stripe / PayPal / Campay + simulation | Code fait ; **à valider avec les clés de l'agence** |
| Documents : confirmation, récapitulatif, facture, réservation, QR | `modules/documents` (PDF) | Fait |
| E-mails + rappels avant départ | `notifications`, `REMINDER_MINUTES`, cron | Fait (SMTP à fournir) |
| SMS / WhatsApp | non inclus : conditionné par un compte prestataire de l'agence | Hors périmètre |
| Multi-devises XAF/EUR/USD | `shared/money.ts` | Fait |
| FR / EN | `src/i18n` (interface, e-mails, pages) ; contenu des offres saisi dans une langue | Fait (partiel : offres) |
| Responsive, tableau de bord admin | CSS adaptatif, `/admin` | Fait |
| SEO | sitemap, robots, métadonnées, JSON-LD | Fait |
| Hébergement, domaine, Let's Encrypt | Dockerfile, Caddy, docs | Livré ; **domaine/serveur à fournir** |
| Backend Spring Boot ou NestJS + Next.js | monolithe Next.js/TypeScript (couches strictes, extractible) | **Écart à valider avec l'agence** |
| Dossier de spécification, plan de recette, code, guide, formation | ce dossier, `RECETTE.md`, code, `GUIDE_UTILISATEUR.md` | Fait (formation à planifier) |
