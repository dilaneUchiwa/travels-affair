"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/client";
import { CurrencyMenu, LangMenu } from "./HeaderMenus";

type Props = { user: { name: string; role: string } | null; logout: () => Promise<void>; currency: string; currencies: string[] };

const BOOK_LINKS = [
  { href: "/vols", key: "flights", d: "M2.5 13.5 21 4l-4 16-5.5-5.5-3 4v-5.5z" },
  { href: "/hotels", key: "hotels", d: "M3 20V8l9-5 9 5v12M9 20v-6h6v6" },
  { href: "/transports", key: "transports", d: "M5 16h14V6H5zM5 12h14M8 19v-3M16 19v-3" },
  { href: "/voitures", key: "cars", d: "M5 16l1.5-5h11L19 16M5 16h14v3H5zM7 19v1M17 19v1" },
  { href: "/activites", key: "activities", d: "M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" },
];

const Arrow = () => (
  <span className="btn-arrow">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </span>
);

export function SiteHeader({ user, logout, currency, currencies }: Props) {
  const pathname = usePathname();
  const { t, lang } = useT();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [book, setBook] = useState(false);
  const bookRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => { setOpen(false); setBook(false); }, [pathname]);
  useEffect(() => {
    if (!book) return;
    const onDown = (e: MouseEvent) => { if (!bookRef.current?.contains(e.target as Node)) setBook(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setBook(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [book]);

  const solid = pathname !== "/";
  return (
    <header className={`site-header${scrolled ? " scrolled" : ""}${solid ? " solid" : ""}`} id="siteHeader">
      <div className="wrap">
        <nav className="nav" aria-label={t("nav.main")}>
          <Link className="brand" href="/" aria-label={t("nav.homeAria")}>
            {process.env.NEXT_PUBLIC_AGENCY_NAME ? (
              <span className="brand-mono" aria-hidden="true">{process.env.NEXT_PUBLIC_AGENCY_NAME.slice(0, 2).toUpperCase()}</span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="brand-logo" src="/img/site/logo.jpg" width="40" height="36" alt="" />
            )}
            {process.env.NEXT_PUBLIC_AGENCY_NAME ?? "Travel’s Affair"}
          </Link>
          <div className={`nav-menu${open ? " open" : ""}`} id="navMenu">
            <ul className="nav-links">
              <li className={`nav-dd${book ? " open" : ""}`} ref={bookRef}>
                <button type="button" className="nav-dd-btn" aria-haspopup="menu" aria-expanded={book} onClick={() => setBook((o) => !o)}>
                  {t("nav.book")}
                  <svg className="chev" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                <ul className="nav-dd-menu" role="menu">
                  {BOOK_LINKS.map((b) => (
                    <li key={b.key} role="none">
                      <Link role="menuitem" href={b.href}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={b.d} /></svg>
                        {t(`nav.${b.key}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li><Link href="/agence">{t("nav.agency")}</Link></li>
              <li><Link href="/contact">{t("nav.contact")}</Link></li>
              {user && <li><Link href="/mon-compte">{t("nav.account")}</Link></li>}
              {user?.role === "ADMIN" && <li><Link href="/admin">{t("nav.admin")}</Link></li>}
              {!user && <li><Link href="/connexion">{t("auth.login")}</Link></li>}
              <li className="hmenus">
                <LangMenu lang={lang} next={pathname} label={t("nav.language")} />
                <CurrencyMenu currency={currency} enabled={currencies} lang={lang} next={pathname} label={t("nav.currency")} />
              </li>
            </ul>
            {user ? (
              <form action={logout}><button type="submit" className="btn nav-cta btn-arrow">{t("nav.logout")}</button></form>
            ) : (
              <Link href="/inscription" className="btn nav-cta btn-arrow">{t("auth.signup")} <Arrow /></Link>
            )}
          </div>
          <button className="nav-toggle" aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")} aria-controls="navMenu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span />
          </button>
        </nav>
      </div>
    </header>
  );
}
