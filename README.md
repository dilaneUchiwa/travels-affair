# Travel's Affair — plateforme de réservation (MVP complet)

Services couverts : **vols** (aller simple, aller-retour, multi-destinations), **hôtels** (établissements, biens, disponibilités par dates), **transports** (bus/train/navette), **location de voitures**, **activités & excursions**. Parcours : offre → réservation → paiement en ligne → confirmation par e-mail (PDF joints) → espace client. Site en **français et anglais**, devises **XAF / EUR / USD**.

Documentation : `docs/SPECIFICATION.md` (traçabilité cahier des charges), `docs/GUIDE_UTILISATEUR.md`, `docs/DEPLOIEMENT.md`, `RECETTE.md`.

## Démarrage

```bash
npm install
cp .env.example .env
npm run setup        # crée la base SQLite (dev.db) + données de démonstration
npm run dev          # http://localhost:3000
npm test             # tests unitaires
npm run build && npm start -- -p 3100 && node scripts/e2e.mjs   # test de bout en bout (playwright-core requis)
```

Si vous aviez une ancienne base : supprimez `dev.db` avant `npm run setup` (le schéma a évolué).

Comptes de démonstration : `admin@travels-affair.com` / `Admin123!` (administration : `/admin`), `demo@client.com` / `Client123!`, `client.en@demo.com` / `Client123!` (client anglophone).
Paiement simulé (sans clés) : carte `4242 4242 4242 4242` acceptée, `4000 0000 0000 0002` refusée ; Mobile Money : numéro `6XXXXXXXX`, refus s'il finit par `000`. Dès que les clés Stripe / PayPal / Campay sont dans `.env`, les vrais prestataires sont utilisés.

## Architecture

```
src/
  app/
    (site)/      Site public — thème Compass (uiCookies). Root layout n°1.
    (admin)/     Administration — thème TailAdmin (MIT) + Tailwind 4. Root layout n°2.
    api/         Tâche planifiée (rappels, expiration) et déconnexion.
  modules/       UN dossier par domaine métier, mêmes couches partout :
    <domaine>/schemas.ts      validation d'entrée (zod)
    <domaine>/repository.ts   accès aux données (Drizzle)
    <domaine>/service.ts      règles métier — aucune dépendance à Next.js
    <domaine>/actions.ts      Server Actions : fines, valident l'identité puis appellent le service
    auth · bookings (+ adapters par service) · catalog (admin piloté par configuration) · payments (+ providers) · notifications · documents · content · uploads · i18n
  db/            schéma Drizzle + client
  shared/        env, erreurs métier, devises, dates, helper d'actions
  components/    UI (site : racine ; admin : components/admin)
```

Choix structurants
- **Machine à états** des réservations (`modules/bookings/status.ts`) : seule porte pour changer un statut (`changeStatus`) ; elle valide la transition, restitue les places une seule fois et déclenche l'e-mail.
- **Pas de survente** : décrément atomique des places (`UPDATE … WHERE seats >= n`) dans une transaction.
- **Prix figé** à la réservation (`unit_price`, `total`, `currency`).
- **Ports/adaptateurs** : `payments/provider.ts` et `notifications/mailer.ts` sont des interfaces. Brancher Stripe, PayPal, un agrégateur Mobile Money ou un autre service d'e-mail = une classe + une ligne dans `registry.ts`/`mailer.ts`.
- **Sécurité** : session JWT en cookie httpOnly ; middleware + vérification du rôle côté serveur ; une réservation n'est visible que par son propriétaire ou un admin (404 sinon) ; redirections `next` filtrées ; secrets validés au démarrage.
- **Deux root layouts** pour que Compass (CSS maison) et TailAdmin (Tailwind) ne se mélangent jamais.

## Configuration, devises, images, paiements (V1.1)

- **Admin → Configuration** : coordonnées de l'agence, devises proposées et taux (XAF/EUR/USD), devise par défaut FR/EN, délais de réservation et rappels, moyens de paiement actifs. Appliqué immédiatement.
- **Admin → Compagnies aériennes** : nom, code IATA, pays, **logo** (téléversé). Chaque vol choisit sa compagnie et décrit ses **escales** (une ligne par escale : `Istanbul (IST) | 2 h 05`).
- **Devise** : le visiteur choisit en haut (XAF par défaut en français) ; les prix affichés et le montant de la réservation sont identiques. **Langue** : menu déroulant avec drapeaux.
- **Photos réelles** : `npm run photos` télécharge des images libres (Wikimedia Commons, crédits dans `public/img/p/CREDITS.md`), puis `rm dev.db && npm run setup`. Sans cela, des illustrations vectorielles fournies sont utilisées. Vos propres photos : Admin → fiche de l'offre.
- **Paiement** : page dédiée avec logos Orange Money, MTN MoMo, Express Union, Visa, Mastercard, PayPal… **CinetPay** s'active en renseignant `CINETPAY_APIKEY` et `CINETPAY_SITE_ID` (voir `.env.example`). Les logos de `public/img/pay/*.svg` sont des pictogrammes génériques : remplacez-les par les logos officiels fournis par CinetPay.
- **QR code** des billets/factures : URL signée `APP_URL/verifier/<réf>?t=…` (renseigner `APP_URL` en production, sinon le QR pointe vers localhost).

## Base de données
SQLite pour la démo. Passage à PostgreSQL : remplacer `drizzle-orm/sqlite-core` par `drizzle-orm/pg-core` dans `src/db/schema.ts`, le client dans `src/db/index.ts`, puis `npm run db:generate`.

## Tâche planifiée (rappels avant départ + expiration des impayés)
Appeler toutes les 5 min (rappels configurables par `REMINDER_MINUTES`, ex. 1440 et 30) : `curl -H "Authorization: Bearer $CRON_SECRET" https://votre-domaine/api/cron/reminders`

## Hors périmètre de cette V1
Hôtels, transports, locations, activités ; anglais ; SMS/WhatsApp ; vrais paiements ; modification d'un vol existant (création et publication seulement) ; photos de vols (images du thème Compass = illustrations à remplacer).

## Licences
Compass © uiCookies (gratuit, usage commercial). TailAdmin © TailAdmin, licence MIT (voir `LICENSE-TAILADMIN`).
