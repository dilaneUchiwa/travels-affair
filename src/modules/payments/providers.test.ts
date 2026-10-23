import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { stripeAmount, verifyStripeSignature } from "./providers/stripe";
import { paypalAmount } from "./providers/paypal";

describe("montants des prestataires", () => {
  it("convertit le XAF en EUR pour Stripe (655,957 XAF = 1 EUR)", () => {
    expect(stripeAmount(65596, "XAF")).toEqual({ currency: "eur", unitAmount: 10000 });
    expect(stripeAmount(50, "USD")).toEqual({ currency: "usd", unitAmount: 5000 });
  });
  it("formate les montants PayPal avec 2 décimales", () => {
    expect(paypalAmount(65596, "XAF")).toEqual({ code: "EUR", value: "100.00" });
    expect(paypalAmount(12.5, "EUR").value).toBe("12.50");
  });
});

describe("signature webhook Stripe", () => {
  const secret = "whsec_test", body = '{"id":"evt_1"}', now = 1_700_000_000_000;
  const sign = (t: number, s = secret) => `t=${t},v1=${createHmac("sha256", s).update(`${t}.${body}`).digest("hex")}`;
  it("accepte une signature valide", () => expect(verifyStripeSignature(body, sign(now / 1000), secret, now)).toBe(true));
  it("refuse un mauvais secret, un corps altéré, une date trop ancienne et l'absence d'en-tête", () => {
    expect(verifyStripeSignature(body, sign(now / 1000, "autre"), secret, now)).toBe(false);
    expect(verifyStripeSignature(body + " ", sign(now / 1000), secret, now)).toBe(false);
    expect(verifyStripeSignature(body, sign(now / 1000 - 600), secret, now)).toBe(false);
    expect(verifyStripeSignature(body, null, secret, now)).toBe(false);
  });
});

import { cinetpayAmount } from "./providers/cinetpay";
describe("CinetPay", () => {
  it("envoie des XAF multiples de 5, minimum 100", () => {
    expect(cinetpayAmount(12342, "XAF") % 5).toBe(0);
    expect(cinetpayAmount(10, "XAF")).toBe(100);
    expect(cinetpayAmount(10, "EUR") % 5).toBe(0);
  });
});
