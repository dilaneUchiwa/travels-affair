export const CURRENCIES = ["XAF", "EUR", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Valeur de 1 unité de la devise en XAF. EUR est ancré (parité fixe 655,957). USD est indicatif. */
export const XAF_PER_UNIT: Record<Currency, number> = { XAF: 1, EUR: 655.957, USD: 600 };

/** Configuration appliquée depuis l'administration (taux, devises proposées, devise par défaut par langue). */
export const MONEY = {
  enabled: [...CURRENCIES] as Currency[],
  defaults: { fr: "XAF", en: "EUR" } as Record<"fr" | "en", Currency>,
};
export function applyMoneyConfig(c: { rates: { EUR: number; USD: number }; enabled: Currency[]; defaults: Record<"fr" | "en", Currency> }) {
  XAF_PER_UNIT.EUR = c.rates.EUR;
  XAF_PER_UNIT.USD = c.rates.USD;
  MONEY.enabled = c.enabled.length ? c.enabled : ["XAF"];
  MONEY.defaults = c.defaults;
}

/** Conversion arrondie aux unités entières de la devise (XAF : multiple de 5), utilisée pour l'affichage ET la réservation. */
export function convertRounded(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  const v = (amount * XAF_PER_UNIT[from]) / XAF_PER_UNIT[to];
  return to === "XAF" ? Math.max(5, Math.round(v / 5) * 5) : Math.max(1, Math.round(v));
}

export function isCurrency(v: string): v is Currency {
  return (CURRENCIES as readonly string[]).includes(v);
}

export function convert(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  const inXaf = amount * XAF_PER_UNIT[from];
  const result = inXaf / XAF_PER_UNIT[to];
  return to === "XAF" ? Math.round(result) : Math.round(result * 100) / 100;
}

export function formatMoney(amount: number, currency: string, lang: "fr" | "en" = "fr"): string {
  const digits = currency === "XAF" ? 0 : 2;
  const n = new Intl.NumberFormat(lang === "en" ? "en-GB" : "fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(amount);
  return currency === "XAF" ? `${n} FCFA` : `${n} ${currency === "EUR" ? "€" : "$"}`;
}

/** "≈ 1 234 € · 800 000 FCFA" : équivalents indicatifs dans les autres devises. */
export function equivalents(amount: number, currency: string, lang: "fr" | "en" = "fr"): string {
  if (!isCurrency(currency)) return "";
  return CURRENCIES.filter((c) => c !== currency)
    .map((c) => formatMoney(convert(amount, currency, c), c, lang))
    .join(" · ");
}
