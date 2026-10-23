import { DICTIONARY } from "@/i18n/dictionary";
import type { Lang, TFn } from "@/i18n";
import { formatMoney } from "@/shared/money";
import type { DetailLine } from "./types";

export const parseDetails = (b: { details: string }): DetailLine[] => {
  try {
    return JSON.parse(b.details) as DetailLine[];
  } catch {
    return [];
  }
};

/** Valeur de détail : traduite quand c'est un code connu (BUS, TRAIN…), telle quelle sinon. */
export const detailValue = (t: TFn, v: string) => (DICTIONARY[`val.${v}`] ? t(`val.${v}`) : v);

type Priced = { serviceType: string; quantity: number; multiplier: number; unitPrice: number; currency: string };

/** « 2 × 640 € passager » ou « 1 × 45 000 FCFA unité × 3 nuit(s) ». */
export function priceBreakdown(b: Priced, t: TFn, lang: Lang): string {
  const unit = t(`unit.${b.serviceType}`);
  const mult = b.multiplier > 1 || DICTIONARY[`multiplier.${b.serviceType}`] ? `× ${b.multiplier} ${t(`multiplier.${b.serviceType}`)}` : "";
  return `${b.quantity} × ${formatMoney(b.unitPrice, b.currency, lang)} (${unit}) ${mult}`.trim();
}
