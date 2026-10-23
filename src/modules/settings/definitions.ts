/** Catalogue des réglages modifiables depuis l'administration (Configuration). La valeur par défaut s'applique tant que rien n'est enregistré. */
export type SettingDef = {
  key: string;
  group: "agency" | "currency" | "booking" | "payment";
  label: string;
  help?: string;
  type: "text" | "email" | "textarea" | "number" | "select" | "multi";
  default: string;
  options?: { value: string; label: string }[];
  min?: number;
};

export const GROUPS: { id: SettingDef["group"]; title: string; description: string }[] = [
  { id: "agency", title: "Agence", description: "Coordonnées affichées sur le site, dans le pied de page, la page Contact et les documents." },
  { id: "currency", title: "Devises", description: "Devises proposées aux clients, devise par défaut selon la langue et taux de change." },
  { id: "booking", title: "Réservations", description: "Délais d'expiration et rappels avant le départ." },
  { id: "payment", title: "Moyens de paiement", description: "Moyens proposés sur la page de paiement. Les clés des passerelles (CinetPay, Stripe, PayPal, Campay) se saisissent dans le fichier .env du serveur." },
];

export const PAYMENT_METHODS = [
  { value: "ORANGE_MONEY", label: "Orange Money" },
  { value: "MTN_MOMO", label: "MTN Mobile Money" },
  { value: "EXPRESS_UNION", label: "Express Union Mobile Money" },
  { value: "CARD", label: "Visa / Mastercard" },
  { value: "PAYPAL", label: "PayPal" },
];

export const SETTINGS: SettingDef[] = [
  { key: "agency.name", group: "agency", label: "Nom de l'agence", type: "text", default: "Travel's Affair" },
  { key: "agency.email", group: "agency", label: "E-mail de contact", type: "email", default: "agence.yaounde@travels-affair.com", help: "Reçoit aussi les messages du formulaire de contact (sauf si CONTACT_TO est défini)." },
  { key: "agency.phone", group: "agency", label: "Téléphone", type: "text", default: "+237 696 35 82 62" },
  { key: "agency.whatsapp", group: "agency", label: "WhatsApp (numéro international)", type: "text", default: "237696358262", help: "Ex. 237690000000, affiche un lien WhatsApp si renseigné." },
  { key: "agency.address", group: "agency", label: "Adresse", type: "text", default: "Face Tsinga Dubaï, Immeuble Italia Optique (face Pharmacie Notre Dame), 875 Av. du 27 Août 1940, BP 13368, Yaoundé, Cameroun" },
  { key: "agency.hoursFr", group: "agency", label: "Horaires (français)", type: "text", default: "Lun–Ven 8h–18h, Sam 8h30–12h15. Service 24h/24 et 7j/7 par téléphone, WhatsApp ou e-mail." },
  { key: "agency.hoursEn", group: "agency", label: "Horaires (anglais)", type: "text", default: "Mon–Fri 8am–6pm, Sat 8:30am–12:15pm. 24/7 service by phone, WhatsApp or email." },
  { key: "agency.facebook", group: "agency", label: "Page Facebook (URL)", type: "text", default: "https://www.facebook.com/share/1FmPQRT4AA/" },
  { key: "agency.instagram", group: "agency", label: "Compte Instagram (URL)", type: "text", default: "" },

  { key: "currency.enabled", group: "currency", label: "Devises proposées", type: "multi", default: "XAF,EUR,USD", options: [{ value: "XAF", label: "Franc CFA (XAF)" }, { value: "EUR", label: "Euro (EUR)" }, { value: "USD", label: "Dollar US (USD)" }] },
  { key: "currency.defaultFr", group: "currency", label: "Devise par défaut (site en français)", type: "select", default: "XAF", options: [{ value: "XAF", label: "XAF" }, { value: "EUR", label: "EUR" }, { value: "USD", label: "USD" }] },
  { key: "currency.defaultEn", group: "currency", label: "Devise par défaut (site en anglais)", type: "select", default: "EUR", options: [{ value: "XAF", label: "XAF" }, { value: "EUR", label: "EUR" }, { value: "USD", label: "USD" }] },
  { key: "rate.EUR", group: "currency", label: "Valeur de 1 EUR en XAF", type: "number", default: "655.957", min: 1, help: "Parité fixe officielle : 655,957." },
  { key: "rate.USD", group: "currency", label: "Valeur de 1 USD en XAF", type: "number", default: "600", min: 1, help: "Taux variable : à mettre à jour régulièrement." },

  { key: "booking.pendingTtl", group: "booking", label: "Expiration d'une réservation impayée (minutes)", type: "number", default: "30", min: 5 },
  { key: "booking.reminders", group: "booking", label: "Rappels avant départ (minutes, séparées par des virgules)", type: "text", default: "1440,30", help: "Ex. 1440,30 = rappel 24 h puis 30 min avant le départ." },

  { key: "payment.methods", group: "payment", label: "Moyens de paiement actifs", type: "multi", default: "ORANGE_MONEY,MTN_MOMO,EXPRESS_UNION,CARD,PAYPAL", options: PAYMENT_METHODS },
];

export const DEFAULTS: Record<string, string> = Object.fromEntries(SETTINGS.map((s) => [s.key, s.default]));
