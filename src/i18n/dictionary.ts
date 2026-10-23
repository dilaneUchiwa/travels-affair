import { auth } from "./dict/auth";
import { booking } from "./dict/booking";
import { common } from "./dict/common";
import { offers } from "./dict/offers";
import { pagesDict } from "./dict/pages";

export type Entry = readonly [fr: string, en: string];
/** Toutes les chaînes de l'interface publique et des e-mails, organisées par domaine dans ./dict. */
export const DICTIONARY: Record<string, Entry> = { ...common, ...auth, ...booking, ...offers, ...pagesDict };
