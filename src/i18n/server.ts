import "server-only";
import { cookies, headers } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, isLang, makeT, type Lang } from "./index";

/** Langue de la requête : cookie, sinon en-tête Accept-Language, sinon français. */
export function getLang(): Lang {
  const c = cookies().get(LANG_COOKIE)?.value;
  if (isLang(c)) return c;
  const accept = headers().get("accept-language")?.toLowerCase() ?? "";
  return accept.startsWith("en") ? "en" : DEFAULT_LANG;
}

export function getT() {
  const lang = getLang();
  return { lang, t: makeT(lang) };
}
