import Link from "next/link";
import { cfg, loadConfig } from "@/modules/settings/service";
import { getT } from "@/i18n/server";

export async function Footer() {
  await loadConfig();
  const { t, lang } = getT();
  const name = cfg("agency.name");
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link className="brand" href="/">{name}</Link>
            <p>{t("footer.about")}</p>
            <ul className="footer-contact">
              {cfg("agency.address") && <li>{cfg("agency.address")}</li>}
              {cfg("agency.phone") && <li><a href={`tel:${cfg("agency.phone").replace(/\s/g, "")}`}>{cfg("agency.phone")}</a></li>}
              {cfg("agency.email") && <li><a href={`mailto:${cfg("agency.email")}`}>{cfg("agency.email")}</a></li>}
              <li className="muted-hours">{lang === "en" ? cfg("agency.hoursEn") : cfg("agency.hoursFr")}</li>
            </ul>
            <div className="footer-social">
              {cfg("agency.facebook") && <a href={cfg("agency.facebook")} rel="noopener" aria-label="Facebook">f</a>}
              {cfg("agency.instagram") && <a href={cfg("agency.instagram")} rel="noopener" aria-label="Instagram">in</a>}
              {cfg("agency.whatsapp") && <a href={`https://wa.me/${cfg("agency.whatsapp").replace(/\D/g, "")}`} rel="noopener" aria-label="WhatsApp">wa</a>}
            </div>
          </div>
          <div className="footer-col">
            <h4>{t("footer.travel")}</h4>
            <ul>
              <li><Link href="/vols">{t("nav.flights")}</Link></li>
              <li><Link href="/hotels">{t("nav.hotels")}</Link></li>
              <li><Link href="/transports">{t("nav.transports")}</Link></li>
              <li><Link href="/voitures">{t("nav.cars")}</Link></li>
              <li><Link href="/activites">{t("nav.activities")}</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>{t("footer.info")}</h4>
            <ul>
              <li><Link href="/agence">{t("nav.agency")}</Link></li>
              <li><Link href="/infos-pratiques">{t("nav.practical")}</Link></li>
              <li><Link href="/faq">{t("nav.faq")}</Link></li>
              <li><Link href="/contact">{t("nav.contact")}</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>{t("footer.account")}</h4>
            <ul>
              <li><Link href="/connexion">{t("auth.login")}</Link></li>
              <li><Link href="/inscription">{t("auth.signup")}</Link></li>
              <li><Link href="/mon-compte">{t("nav.myBookings")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {name}</span>
          <span>{t("footer.theme")} <a href="https://uicookies.com" rel="noopener">Compass</a> uiCookies</span>
        </div>
      </div>
    </footer>
  );
}
