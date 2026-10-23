import Link from "next/link";
import type { ReactNode } from "react";
import type { TFn } from "@/i18n";
import { Stars } from "@/components/Stars";
import { parsePhotos } from "@/modules/uploads/service";

/* ---------- Icônes (traits, 24×24) ---------- */
const PATHS = {
  plane: "M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z",
  clock: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  calendar: "M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  users: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM21 19v-1a3 3 0 0 0-2-2.8M16 4.2a3 3 0 0 1 0 5.6",
  bag: "M6 8h12l1 12H5L6 8zM9 8V6a3 3 0 0 1 6 0v2",
  pin: "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  car: "M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16M4 16h16v3H4zM7 19v1M17 19v1",
  bed: "M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-8v6M7 11.5a1.5 1.5 0 1 0 0-.01",
  bus: "M5 4h14a1 1 0 0 1 1 1v11H4V5a1 1 0 0 1 1-1zM4 11h16M7 19v1M17 19v1M8 16v3M16 16v3",
  star: "M12 3l2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1L3.2 9.4l6.1-.8z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  shield: "M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3zM9 12l2 2 4-4",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  refresh: "M20 11a8 8 0 0 0-14.5-3.5L4 9M4 4v5h5M4 13a8 8 0 0 0 14.5 3.5L20 15M20 20v-5h-5",
  steering: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 14v7M10 12.5L3.5 11M14 12.5l6.5-1.5",
  tag: "M3 12V4h8l10 10-8 8L3 12zM7.5 8.5h.01",
} as const;
export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={name === "plane" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

/* ---------- En-tête de page : fil d'Ariane, badges, titre ---------- */
export function DetailHero(props: {
  t: TFn; crumb: { href: string; label: string }; badges?: string[]; title: string; subtitle?: string; stars?: number; icon: IconName; photos: string; logo?: string | null;
}) {
  const first = parsePhotos(props.photos)[0];
  return (
    <header className="d-hero">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">{props.t("nav.home")}</Link><span>/</span><Link href={props.crumb.href}>{props.crumb.label}</Link><span>/</span><b>{props.title}</b>
      </nav>
      <div className="d-hero-main">
        <div>
          <div className="d-badges">
            {props.badges?.filter(Boolean).map((b) => <span className="d-badge" key={b}>{b}</span>)}
            {props.stars ? <Stars value={props.stars} size={20} label={`${props.stars}/5`} /> : null}
          </div>
          <h1>{props.title}</h1>
          {props.subtitle && <p className="d-sub">{props.logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img className="d-logo" src={props.logo} alt="" /> : <Icon name="pin" size={16} />} {props.subtitle}</p>}
        </div>
      </div>
      <Cover photos={props.photos} icon={props.icon} title={props.title} hasPhoto={!!first} />
    </header>
  );
}

/** Photos si elles existent, sinon une couverture illustrée animée (ciel, nuages, icône du service). */
function Cover({ photos, icon, title, hasPhoto }: { photos: string; icon: IconName; title: string; hasPhoto: boolean }) {
  if (!hasPhoto) {
    return (
      <div className="d-cover" aria-hidden="true">
        <div className="d-cover-ic"><Icon name={icon} size={64} /></div>
        <span>{title}</span>
      </div>
    );
  }
  const list = parsePhotos(photos);
  return (
    <div className={`d-photos n${Math.min(list.length, 5)}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {list.slice(0, 5).map((u, i) => <img key={u} src={u} alt={i === 0 ? title : ""} loading={i ? "lazy" : "eager"} />)}
    </div>
  );
}

/* ---------- Faits clés ---------- */
export type Fact = { icon: IconName; label: string; value: ReactNode };
export function Facts({ items }: { items: Fact[] }) {
  return (
    <ul className="d-facts">
      {items.filter((f) => f.value !== undefined && f.value !== null && f.value !== "").map((f) => (
        <li key={f.label}><span className="ic"><Icon name={f.icon} /></span><div><small>{f.label}</small><b>{f.value}</b></div></li>
      ))}
    </ul>
  );
}

/* ---------- Sections de contenu ---------- */
export function Section({ title, icon, children }: { title: string; icon?: IconName; children: ReactNode }) {
  return (
    <section className="d-section">
      <h2>{icon && <span className="ic"><Icon name={icon} size={18} /></span>}{title}</h2>
      {children}
    </section>
  );
}

export function Highlights({ csv }: { csv: string }) {
  const items = csv.split(",").map((s) => s.trim()).filter(Boolean);
  if (!items.length) return null;
  return <ul className="d-highlights">{items.map((i) => <li key={i}><Icon name="check" size={16} />{i}</li>)}</ul>;
}

export function Lines({ text }: { text: string }) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  return <ul className="d-lines">{lines.map((l) => <li key={l}>{l}</li>)}</ul>;
}

export function Prose({ text }: { text: string }) {
  return <>{text.split(/\n{2,}/).map((p) => <p key={p}>{p}</p>)}</>;
}

/** Bloc repliable pour conditions / annulation. */
export function Policy({ title, icon, text }: { title: string; icon: IconName; text: string }) {
  return (
    <details className="d-policy" open>
      <summary><span className="ic"><Icon name={icon} size={18} /></span>{title}</summary>
      <Prose text={text || "–"} />
    </details>
  );
}

/* ---------- Trajet (vols, transports) ---------- */
type Stop = { place: string; duration: string };
export function RouteTimeline(props: {
  from: { place: string; code?: string; time: string; date: string }; to: { place: string; code?: string; time: string; date: string };
  duration: string; note?: string; stops?: Stop[]; stopsTitle?: string;
}) {
  const stops = props.stops ?? [];
  return (
    <div className="d-route-wrap">
      <div className="d-route">
        <div className="pt"><b className="time">{props.from.time}</b><span className="place">{props.from.place}</span><small>{[props.from.code, props.from.date].filter(Boolean).join(" · ")}</small></div>
        <div className="mid">
          <small>{props.duration}</small>
          <div className="track">
            {stops.map((st, i) => <span key={st.place} className="stop" style={{ left: `${((i + 1) / (stops.length + 1)) * 100}%` }} title={st.place}><i /></span>)}
            <span className="plane"><Icon name="plane" size={20} /></span>
          </div>
          {props.note && <small>{props.note}</small>}
        </div>
        <div className="pt end"><b className="time">{props.to.time}</b><span className="place">{props.to.place}</span><small>{[props.to.code, props.to.date].filter(Boolean).join(" · ")}</small></div>
      </div>
      {stops.length > 0 && (
        <div className="d-stops">
          {props.stopsTitle && <h4>{props.stopsTitle}</h4>}
          <ol>{stops.map((st) => <li key={st.place}><span className="dot" /><b>{st.place}</b>{st.duration && <em>{st.duration}</em>}</li>)}</ol>
        </div>
      )}
    </div>
  );
}

/* ---------- Mise en page à deux colonnes + carte de réservation ---------- */
export function DetailLayout({ main, aside }: { main: ReactNode; aside: ReactNode }) {
  return <div className="d-layout"><div className="d-main">{main}</div>{aside}</div>;
}

export function BookCard({ t, children }: { t: TFn; children: ReactNode }) {
  return (
    <aside className="d-book">
      <div className="d-book-card">{children}</div>
      <ul className="d-trust">
        <li><Icon name="shield" size={18} />{t("detail.trust1")}</li>
        <li><Icon name="doc" size={18} />{t("detail.trust2")}</li>
        <li><Icon name="refresh" size={18} />{t("detail.trust3")}</li>
      </ul>
    </aside>
  );
}
