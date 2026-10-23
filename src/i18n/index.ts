// Internationalisation sans dépendance : dictionnaire plat « clé → [français, anglais] ».
// Ajouter une langue = ajouter une colonne dans LANGS et dans chaque entrée.
import { DICTIONARY } from "./dictionary";

export const LANGS = ["fr", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "fr";
export const LANG_COOKIE = "ta_lang";

export const isLang = (v: unknown): v is Lang => typeof v === "string" && (LANGS as readonly string[]).includes(v);

export type Vars = Record<string, string | number>;
export type TFn = (key: string, vars?: Vars) => string;

/** Traduit une clé ; replie sur le français, puis sur la clé elle-même (visible, donc repérable en recette). */
export function translate(lang: Lang, key: string, vars?: Vars): string {
  const entry = DICTIONARY[key];
  let text = entry ? (entry[LANGS.indexOf(lang)] ?? entry[0]) : key;
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

export const makeT = (lang: Lang): TFn => (key, vars) => translate(lang, key, vars);

/** Dictionnaire aplati pour une langue (envoyé aux composants client). */
export function dictionaryFor(lang: Lang): Record<string, string> {
  const i = LANGS.indexOf(lang);
  return Object.fromEntries(Object.entries(DICTIONARY).map(([k, v]) => [k, v[i] ?? v[0]]));
}
