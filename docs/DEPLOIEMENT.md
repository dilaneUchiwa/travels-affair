# Déploiement

## Option A — VPS avec Docker (recommandée)
Prérequis : un serveur Linux, un nom de domaine dont l'enregistrement A pointe vers le serveur, Docker.
1. `cp .env.example .env` puis renseigner : `AUTH_SECRET` (`openssl rand -base64 32`), `APP_URL=https://votre-domaine`, `CRON_SECRET`, SMTP, `CONTACT_TO`, clés de paiement.
2. `DOMAIN=votre-domaine docker compose up -d --build`
3. Caddy obtient et renouvelle automatiquement le certificat **Let's Encrypt** (HTTPS). Le service `cron` appelle les rappels toutes les 5 minutes.
4. Première mise en route : `docker compose exec app npx tsx scripts/seed.ts` (données de démonstration) ou créer l'administrateur réel puis supprimer les comptes de démo.
5. Sauvegardes : volume `appdata` (base SQLite + photos). Pour un trafic soutenu, migrer vers PostgreSQL (voir README).

## Option B — hébergement mutualisé Node.js
`npm ci && npm run build`, démarrer `npm start`, planifier `curl -H "Authorization: Bearer $CRON_SECRET" https://domaine/api/cron/reminders` toutes les 5 minutes. HTTPS : Let's Encrypt via le panneau de l'hébergeur.

## Paiements en ligne (fournis par l'agence)
- Cartes Visa/Mastercard : compte Stripe, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, webhook `https://domaine/api/webhooks/stripe` (événement `checkout.session.completed`).
- PayPal : application REST, `PAYPAL_CLIENT_ID/SECRET`, `PAYPAL_ENV=live`.
- Orange Money / MTN MoMo : compte agrégateur Campay, `CAMPAY_USERNAME/PASSWORD/BASE_URL`.
Tester d'abord en mode sandbox/démo avant la production.

## SMS / WhatsApp
Prévus uniquement si l'agence fournit un compte prestataire (Twilio, WhatsApp Business…) : brancher un envoi dans `modules/notifications/` à côté de l'e-mail.

## Domaine & SEO
`sitemap.xml` et `robots.txt` sont générés ; renseigner `APP_URL` pour que les URL canoniques soient correctes.
