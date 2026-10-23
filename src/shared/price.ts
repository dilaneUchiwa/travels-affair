import "server-only";
import { cookies } from "next/headers";
import { getLang } from "@/i18n/server";
import { CURRENCY_COOKIE, displayAmount, money, others, pickCurrency } from "./currency";
import type { Currency } from "./money";

/** Devise d'affichage de la requête (cookie → défaut de la langue). */
export function getCurrency(): Currency {
  return pickCurrency(cookies().get(CURRENCY_COOKIE)?.value, getLang());
}

/** Prix d'une offre dans la devise choisie par le visiteur. */
export function price(amount: number, from: string, factor = 1): string {
  const cur = getCurrency();
  return money(displayAmount(amount, from, cur) * factor, cur, cur, getLang());
}
export function priceOthers(amount: number, from: string): string {
  return others(amount, from, getCurrency(), getLang());
}
