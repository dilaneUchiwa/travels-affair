import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, isLang, makeT, type Lang } from "./index";

/** Langue de la requête : choix explicite du visiteur (cookie), sinon français par défaut. */
export function getLang(): Lang {
  const c = cookies().get(LANG_COOKIE)?.value;
  if (isLang(c)) return c;
  return DEFAULT_LANG;
}

export function getT() {
  const lang = getLang();
  return { lang, t: makeT(lang) };
}
