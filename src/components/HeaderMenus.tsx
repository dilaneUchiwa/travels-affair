"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Lang } from "@/i18n";

/* Drapeaux en SVG (aucune dépendance aux emoji, qui ne s'affichent pas sous Windows). */
export function Flag({ lang }: { lang: Lang }) {
  return lang === "fr" ? (
    <svg className="flag" viewBox="0 0 30 20" aria-hidden="true"><rect width="10" height="20" fill="#0055a4" /><rect x="10" width="10" height="20" fill="#fff" /><rect x="20" width="10" height="20" fill="#ef4135" /></svg>
  ) : (
    <svg className="flag" viewBox="0 0 30 20" aria-hidden="true">
      <rect width="30" height="20" fill="#012169" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#fff" strokeWidth="4" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#c8102e" strokeWidth="1.6" />
      <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6" />
      <path d="M15 0v20M0 10h30" stroke="#c8102e" strokeWidth="3.4" />
    </svg>
  );
}

const SYMBOL: Record<string, string> = { XAF: "F", EUR: "€", USD: "$" };
const NAME: Record<string, [string, string]> = { XAF: ["Franc CFA", "CFA franc"], EUR: ["Euro", "Euro"], USD: ["Dollar US", "US dollar"] };

function Menu({ label, button, children }: { label: string; button: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div className={`hmenu${open ? " open" : ""}`} ref={ref}>
      <button type="button" className="hmenu-btn" aria-haspopup="menu" aria-expanded={open} aria-label={label} onClick={() => setOpen((o) => !o)}>
        {button}
        <svg className="chev" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && <ul className="hmenu-list" role="menu" onClick={() => setOpen(false)}>{children}</ul>}
    </div>
  );
}

export function LangMenu({ lang, next, label }: { lang: Lang; next: string; label: string }) {
  const items: { l: Lang; name: string }[] = [{ l: "fr", name: "Français" }, { l: "en", name: "English" }];
  return (
    <Menu label={label} button={<><Flag lang={lang} /><span>{lang.toUpperCase()}</span></>}>
      {items.map((i) => (
        <li key={i.l} role="none">
          <a role="menuitemradio" aria-checked={i.l === lang} className={i.l === lang ? "on" : ""} href={`/api/lang?l=${i.l}&next=${encodeURIComponent(next)}`} hrefLang={i.l}>
            <Flag lang={i.l} /><span>{i.name}</span>{i.l === lang && <Tick />}
          </a>
        </li>
      ))}
    </Menu>
  );
}

export function CurrencyMenu({ currency, enabled, lang, next, label }: { currency: string; enabled: string[]; lang: Lang; next: string; label: string }) {
  return (
    <Menu label={label} button={<><span className="cur-sym">{SYMBOL[currency]}</span><span>{currency}</span></>}>
      {enabled.map((c) => (
        <li key={c} role="none">
          <a role="menuitemradio" aria-checked={c === currency} className={c === currency ? "on" : ""} href={`/api/currency?c=${c}&next=${encodeURIComponent(next)}`}>
            <span className="cur-sym">{SYMBOL[c]}</span><span>{c} · {NAME[c][lang === "fr" ? 0 : 1]}</span>{c === currency && <Tick />}
          </a>
        </li>
      ))}
    </Menu>
  );
}

const Tick = () => <svg className="tick" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
