"use client";

import { createContext, useContext, useMemo } from "react";
import type { Lang, TFn } from "./index";

type Ctx = { lang: Lang; dict: Record<string, string> };
const I18nContext = createContext<Ctx>({ lang: "fr", dict: {} });

export function I18nProvider({ lang, dict, children }: Ctx & { children: React.ReactNode }) {
  const value = useMemo(() => ({ lang, dict }), [lang, dict]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): { t: TFn; lang: Lang } {
  const { lang, dict } = useContext(I18nContext);
  const t: TFn = (key, vars) => {
    let text = dict[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
    return text;
  };
  return { t, lang };
}
