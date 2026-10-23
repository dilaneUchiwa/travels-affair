"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "@/i18n/client";
import { CurrencyMenu, LangMenu } from "./HeaderMenus";

type Props = { user: { name: string; role: string } | null; logout: () => Promise<void>; currency: string; currencies: string[] };

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  const solid = pathname !== "/";
  return (
    <header className={`site-header${scrolled ? " scrolled" : ""}${solid ? " solid" : ""}`} id="siteHeader">
      <div className="wrap">
        <nav className="nav" aria-label={t("nav.main")}>
          <Link className="brand" href="/" aria-label={t("nav.homeAria")}>
            <svg className="brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <circle className="ring" cx="16" cy="16" r="12.6" strokeWidth="1.6" />
              <path className="ew" d="M4 16 L16 14.8 L28 16 L16 17.2 Z" strokeWidth="1" />
              <path className="nn" d="M16 4.6 L13.4 16 L18.6 16 Z" />
              <path className="ss" d="M16 27.4 L13.4 16 L18.6 16 Z" />
              <circle className="dot" cx="16" cy="16" r="1.6" />
            </svg>
            Travel&apos;s Affair
          </Link>
          <div className={`nav-menu${open ? " open" : ""}`} id="navMenu">
            <ul className="nav-links">
              <li><Link href="/vols">{t("nav.flights")}</Link></li>
              <li><Link href="/hotels">{t("nav.hotels")}</Link></li>
              <li><Link href="/transports">{t("nav.transports")}</Link></li>
              <li><Link href="/voitures">{t("nav.cars")}</Link></li>
              <li><Link href="/activites">{t("nav.activities")}</Link></li>
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
