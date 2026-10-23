"use client";

import { useState } from "react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { useT } from "@/i18n/client";
import { payAction } from "./actions";
import type { PaymentMethod } from "./schemas";

type Props = {
  bookingId: string;
  amountLabel: string;
  methods: PaymentMethod[]; // moyens actifs (Configuration)
  simulated: Record<PaymentMethod, boolean>;
  hosted: Record<PaymentMethod, boolean>; // redirection vers la page sécurisée du prestataire
  xafNote: boolean;
};

const LOGOS: Record<PaymentMethod, string[]> = {
  ORANGE_MONEY: ["ORANGE_MONEY"], MTN_MOMO: ["MTN_MOMO"], EXPRESS_UNION: ["EXPRESS_UNION"], CARD: ["VISA", "MASTERCARD"], PAYPAL: ["PAYPAL"],
};
const GROUPS: { id: string; title: string; methods: PaymentMethod[] }[] = [
  { id: "mobile", title: "pay.group.mobile", methods: ["ORANGE_MONEY", "MTN_MOMO", "EXPRESS_UNION"] },
  { id: "cards", title: "pay.group.cards", methods: ["CARD", "PAYPAL"] },
];

export function PayForm({ bookingId, amountLabel, methods, simulated, hosted, xafNote }: Props) {
  const { t } = useT();
  const [method, setMethod] = useState<PaymentMethod>(methods[0]);
  const isMobile = method === "ORANGE_MONEY" || method === "MTN_MOMO" || method === "EXPRESS_UNION";
  return (
    <ActionForm action={payAction}>
      <input type="hidden" name="bookingId" value={bookingId} />
      {GROUPS.map((g) => {
        const list = g.methods.filter((m) => methods.includes(m));
        if (!list.length) return null;
        return (
          <fieldset className="pay-group" key={g.id}>
            <legend>{t(g.title)}</legend>
            <div className="pay-tiles">
              {list.map((m) => (
                <label key={m} className={`pay-tile${method === m ? " on" : ""}`}>
                  <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} />
                  <span className="pay-logos">
                    {LOGOS[m].map((l) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={l} src={`/img/pay/${l}.svg`} alt="" width={64} height={34} />)}
                  </span>
                  <span className="pay-name">{t(`pay.method.${m}`)}</span>
                  <span className="pay-check" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}

      <div className="pay-panel">
        {method === "CARD" && simulated.CARD && (
          <div className="stack">
            <div><label htmlFor="holder">{t("pay.holder")}</label><input id="holder" name="holder" autoComplete="cc-name" /></div>
            <div><label htmlFor="cardNumber">{t("pay.cardNumber")}</label><input id="cardNumber" name="cardNumber" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" /></div>
            <div className="grid-2">
              <div><label htmlFor="expiry">{t("pay.expiry")}</label><input id="expiry" name="expiry" placeholder="MM/YY" autoComplete="cc-exp" /></div>
              <div><label htmlFor="cvc">CVC</label><input id="cvc" name="cvc" inputMode="numeric" autoComplete="cc-csc" /></div>
            </div>
          </div>
        )}
        {method === "CARD" && !simulated.CARD && <p className="muted">{t("pay.redirectCard")}</p>}
        {method === "PAYPAL" && <p className="muted">{simulated.PAYPAL ? t("pay.paypalDemo") : t("pay.redirectPaypal")}</p>}
        {isMobile && (
          <div>
            <label htmlFor="phone">{t("pay.phone", { op: t(`pay.method.${method}`) })}</label>
            <input id="phone" name="phone" inputMode="tel" placeholder="6 XX XX XX XX" autoComplete="tel" />
            <p className="muted" style={{ marginTop: ".4rem", fontSize: ".85rem" }}>{hosted[method] ? t("pay.redirectMobile") : t("pay.momoHint")}</p>
          </div>
        )}
        {xafNote && (method === "CARD" || method === "PAYPAL") && !simulated[method] && !hosted[method] && <p className="muted" style={{ marginTop: ".8rem", fontSize: ".85rem" }}>{t("pay.xafNote")}</p>}
        {simulated[method] && <p className="alert info" style={{ marginTop: "1rem", fontSize: ".85rem" }}>{t("pay.demo")}</p>}
      </div>
      <div style={{ marginTop: "1.2rem" }}><SubmitButton>{t("pay.submit", { amount: amountLabel })}</SubmitButton></div>
    </ActionForm>
  );
}
