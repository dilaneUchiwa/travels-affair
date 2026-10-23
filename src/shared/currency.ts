import { MONEY, convertRounded, formatMoney, isCurrency, equivalents, type Currency } from "./money";
import type { Lang } from "./dates";

export const CURRENCY_COOKIE = "ta_cur";

/** Devise d'affichage choisie : valeur du cookie si elle est proposée, sinon défaut selon la langue. */
export function pickCurrency(cookie: string | undefined, lang: Lang): Currency {
  return cookie && isCurrency(cookie) && MONEY.enabled.includes(cookie) ? cookie : MONEY.defaults[lang] && MONEY.enabled.includes(MONEY.defaults[lang]) ? MONEY.defaults[lang] : MONEY.enabled[0];
}

export const displayAmount = (amount: number, from: string, to: Currency) => (isCurrency(from) ? convertRounded(amount, from, to) : amount);
export const money = (amount: number, from: string, to: Currency, lang: Lang) => formatMoney(displayAmount(amount, from, to), isCurrency(from) ? to : from, lang);
export const others = (amount: number, from: string, to: Currency, lang: Lang) => equivalents(displayAmount(amount, from, to), to, lang);
