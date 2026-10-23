# Plan de recette — Travel's Affair

Légende : ✅ implémenté et vérifié par test automatique (V1) · ⏳ prévu, hors V1.
Chaque test : **Action → Résultat attendu.**

## Lot 0 — Socle technique ✅
- T0.1 `npm run setup` → base créée, comptes et 6 vols de démonstration présents.
- T0.2 `npm test` → tous les tests unitaires passent.
- T0.3 `npm run build` → compilation sans erreur.

## Lot 1 — Site public ✅ (accueil, vols, hôtels, transports, voitures, activités, agence, infos pratiques, FAQ, contact)
- T1.1 Ouvrir `/` → hero, formulaire de recherche, prochains départs.
- T1.2 `/vols?from=douala` → seuls les vols au départ de Douala.
- T1.3 Ouvrir un vol → détail complet (horaires, bagages, conditions, annulation, prix + équivalents en autres devises).
- T1.4 Affichage mobile (390 px) → pas de défilement horizontal.

## Lot 2 — Administration des vols ✅
- T2.1 Admin → Vols → Ajouter : formulaire complet → vol créé.
- T2.2 Arrivée ≤ départ → message d'erreur.
- T2.3 Vol « brouillon » → invisible côté public ; « Publier » → visible.
- T2.4 Un client connecté ouvre `/admin` → redirigé vers l'accueil.

## Lots 3-5 — Hébergements, transports, locations ✅
- T3.1 Hôtel : dates qui chevauchent une réservation existante sur un bien à 1 unité → refus ; séjours consécutifs (départ 12 h / arrivée 14 h) acceptés.
- T3.2 Voiture : mêmes règles par jour de location (remise 9 h).
- T4.1 Transport / activité : réservation décrémente les places, annulation les restitue.
- T5.1 Admin : créer hôtel, bien, prestataire, transport, marque, modèle, catégorie, véhicule, activité avec photos (≤ 8, ≤ 5 Mo, type vérifié).

## Lot 9 — Contenus, langues, SEO ✅
- T9.1 Bascule FR/EN → interface, e-mails et pages CMS dans la langue choisie.
- T9.2 Mot de passe oublié → e-mail avec lien à usage unique valable 1 h ; même message que l'adresse existe ou non.
- T9.3 Formulaire de contact → message visible en admin ; champ piège anti-robot.
- T9.4 `/sitemap.xml`, `/robots.txt`, métadonnées et JSON-LD présents.

## Lot 10 — Paiements réels et documents ⏳ (à valider avec les clés de l'agence)
- T10.1 Stripe / PayPal / Campay : paiement test en sandbox puis webhook/retour → réservation « Payée ».
- T10.2 PDF : confirmation, récapitulatif, facture, bon avec QR code téléchargeables depuis l'espace client.
- T10.3 Rappels : e-mail à 24 h et 30 min avant le départ (cron toutes les 5 min).

## Lot 6 — Réservation ✅
- T6.1 Client connecté : saisir 2 passagers → réservation « En attente de paiement », 2 places retirées du stock.
- T6.2 Demander plus de places que disponibles → refus clair, stock inchangé.
- T6.3 Annuler une réservation impayée → statut « Annulée », places restituées.
- T6.4 Transition interdite (ex. impayée → confirmée) → refusée.
- T6.5 Un autre client ouvre la réservation → page 404.

## Lot 7 — Paiement ✅ (simulé) / ⏳ (Orange Money, MTN MoMo, Stripe, PayPal réels)
- T7.1 Carte `4000 0000 0000 0002` → « Paiement refusé », réservation inchangée, tentative tracée.
- T7.2 Carte `4242 4242 4242 4242` → statut « Payée », e-mail « Paiement reçu ».
- T7.3 Mobile Money `6XXXXXXXX` → accepté ; numéro finissant par `000` → refus simulé.
- T7.4 Payer une réservation déjà payée → refusé.

## Lot 8 — Notifications ✅ (e-mails) / ⏳ (SMS, WhatsApp)
- T8.1 Réservation, paiement, confirmation → 3 e-mails visibles dans Admin → E-mails envoyés.
- T8.2 `GET /api/cron/reminders` sans jeton → 401 ; avec jeton → rappels envoyés une seule fois, impayés expirés annulés.
- T8.3 SMTP renseigné → e-mails réellement reçus ; SMTP en panne → la réservation n'échoue pas.

## Lot 9 — Documents et espace client ✅
- T9.1 Réservation payée → page avec facture (FAC-<référence>), billet, QR code.
- T9.2 « Imprimer / Enregistrer en PDF » → mise en page imprimable sans menus.
- T9.3 Espace client : liste, statuts, historique ; création de compte et connexion.
- ⏳ Mot de passe oublié.

## Lot 10 — Tableau de bord et gestion des statuts ✅
- T10.1 Admin → tableau de bord : nombre de réservations, vols publiés, montants encaissés par devise.
- T10.2 Admin → Réservations → « Confirmée » → client reçoit l'e-mail de confirmation.
- T10.3 Le menu n'offre que les transitions autorisées.

## Lot 11 — Langues et devises ⏳ (anglais) / ✅ partiel (XAF, EUR, USD affichés avec équivalents indicatifs)

## Lot 12 — Sécurité et SEO ✅ partiel
- T12.1 `/admin` et `/mon-compte` sans session → redirigés vers la connexion.
- T12.2 Mauvais mot de passe → message identique à « e-mail inconnu ».
- T12.3 `?next=//evil.com` → redirection ignorée.
- ⏳ Nom de domaine, certificat Let's Encrypt, sitemap, balises SEO avancées.

## Lot 13 — Démo finale (≈ 10 min)
1. Admin : créer et publier un vol.
2. Client : rechercher, réserver 2 passagers, payer par carte de test.
3. Montrer l'e-mail « Paiement reçu » (Admin → E-mails).
4. Admin : passer la réservation en « Confirmée ».
5. Client : ouvrir le billet avec QR code, l'imprimer.
6. Montrer le tableau de bord (encaissé, statuts).

## Lot 14 — V1.1 (devises, configuration, compagnies, QR)
- T14.1 Menu devise : choisir EUR → prix des listes, fiches et réservation en EUR ; FR = XAF par défaut.
- T14.2 Menu langue avec drapeaux (FR/EN), choix mémorisé.
- T14.3 Admin → Configuration : changer le téléphone → visible dans le pied de page ; taux à 0 → refusé.
- T14.4 Admin → Compagnies aériennes : créer avec logo ; créer un vol avec 2 escales → affichées sur la liste et la fiche.
- T14.5 PDF confirmation / facture / voucher : scanner le QR → page « Réservation valide » ; jeton modifié → « Code non reconnu ».
- T14.6 Page de paiement : tuiles avec logos, panneau selon le moyen choisi, carte de test 4242 4242 4242 4242.
- T14.7 Responsive : aucun défilement horizontal de 320 à 1280 px (site et admin).
