import Link from "next/link";
import type { ReactNode } from "react";
import { parsePhotos } from "@/modules/uploads/service";
import { ActionForm, SubmitButton } from "@/components/forms";
import type { FormState } from "@/shared/action";
import type { Lang, TFn } from "@/i18n";
import { PlaceInput, type PlaceOption } from "@/components/PlaceInput";
import { price as fmtPrice, priceOthers } from "@/shared/price";

export function PageHead({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="page-head">
      <h1>{title}</h1>
      {lead && <p className="muted">{lead}</p>}
    </div>
  );
}

export type SearchField = { name: string; label: string; type?: "text" | "date" | "select"; placeholder?: string; value?: string; options?: { value: string; label: string }[]; suggest?: PlaceOption[] };

/** Barre de recherche GET générique (la requête reste dans l'URL : partageable, indexable). */
export function SearchBar({ fields, action, submit }: { fields: SearchField[]; action: string; submit: string }) {
  return (
    <form className="search-bar" action={action} method="get">
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={`s-${f.name}`}>{f.label}</label>
          {f.suggest ? (
            <PlaceInput id={`s-${f.name}`} name={f.name} placeholder={f.placeholder} defaultValue={f.value} options={f.suggest} />
          ) : f.type === "select" ? (
            <select id={`s-${f.name}`} name={f.name} defaultValue={f.value ?? ""}>
              {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input id={`s-${f.name}`} name={f.name} type={f.type ?? "text"} placeholder={f.placeholder} defaultValue={f.value} />
          )}
        </div>
      ))}
      <button type="submit" className="btn">{submit}</button>
    </form>
  );
}

export function OfferCard(props: {
  href: string; photos: string; fallback: string; tag?: string; title: string; subtitle?: string; meta: ReactNode[];
  price: { amount: number; currency: string; unit: string }; cta: string; lang: Lang;
}) {
  const first = parsePhotos(props.photos)[0];
  return (
    <article className="offer">
      <Link href={props.href} className="offer-media" aria-label={props.title}>
        {first ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={first} alt="" loading="lazy" /> : <span className="fallback">{props.fallback}</span>}
        {props.tag && <span className="badge tag">{props.tag}</span>}
      </Link>
      <div className="offer-body">
        <h3><Link href={props.href}>{props.title}</Link></h3>
        {props.subtitle && <p className="muted" style={{ fontSize: ".9rem" }}>{props.subtitle}</p>}
        <div className="offer-meta">{props.meta.map((m, i) => <span key={i}>{m}</span>)}</div>
        <div className="offer-foot">
          <div>
            <span className="amt">{fmtPrice(props.price.amount, props.price.currency)}</span>
            <small>{props.price.unit}</small>
          </div>
          <Link className="btn small" href={props.href}>{props.cta}</Link>
        </div>
      </div>
    </article>
  );
}

export function Gallery({ photos }: { photos: string }) {
  const list = parsePhotos(photos);
  if (list.length === 0) return null;
  return (
    <div className={`gallery${list.length < 2 ? " single" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div className="main"><img src={list[0]} alt="" /></div>
      {list.length > 1 && (
        <div className="side">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {list.slice(1, 3).map((u) => <img key={u} src={u} alt="" loading="lazy" />)}
        </div>
      )}
    </div>
  );
}

export const Chips = ({ csv }: { csv: string }) => {
  const items = csv.split(",").map((s) => s.trim()).filter(Boolean);
  if (items.length === 0) return null;
  return <div className="chips">{items.map((i) => <span className="chip" key={i}>{i}</span>)}</div>;
};

export function PriceBlock({ amount, currency, unit, lang }: { amount: number; currency: string; unit: string; lang: Lang }) {
  return (
    <div className="price" style={{ textAlign: "left", marginBottom: "1rem" }}>
      <strong>{fmtPrice(amount, currency)}</strong>
      <small>{unit} · ≈ {priceOthers(amount, currency)}</small>
    </div>
  );
}

/** Zone de réservation : formulaire pour un client connecté, invitation à se connecter sinon. */
export function BookBox(props: {
  user: { id: string } | null; t: TFn; nextPath: string; action: (s: FormState, fd: FormData) => Promise<FormState>;
  serviceType: string; itemId: string; submit: string; children: ReactNode;
}) {
  const { t } = props;
  if (!props.user) {
    const next = encodeURIComponent(props.nextPath);
    return (
      <div className="stack">
        <p className="muted">{t("book.loginFirst")}</p>
        <Link className="btn" href={`/connexion?next=${next}`}>{t("auth.login")}</Link>
        <Link className="btn secondary" href={`/inscription?next=${next}`}>{t("auth.signup")}</Link>
      </div>
    );
  }
  return (
    <ActionForm action={props.action}>
      <input type="hidden" name="serviceType" value={props.serviceType} />
      <input type="hidden" name="itemId" value={props.itemId} />
      {props.children}
      <div style={{ marginTop: "1rem" }}><SubmitButton>{props.submit}</SubmitButton></div>
    </ActionForm>
  );
}

export const Participants = ({ t, label, placeholder }: { t: TFn; label: string; placeholder?: string }) => (
  <div className="field">
    <label htmlFor="participants">{label}</label>
    <textarea id="participants" name="participants" rows={3} required placeholder={placeholder ?? "Jean Dupont\nMarie Dupont"} />
    <p className="muted" style={{ fontSize: ".82rem", marginTop: ".3rem" }}>{t("book.onePerLine")}</p>
  </div>
);
