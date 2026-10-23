import { createHmac, timingSafeEqual } from "node:crypto";
import { convert, type Currency } from "@/shared/money";
import type { ChargeRequest, ChargeResult, PaymentProvider, VerifyResult } from "../provider";
import { http } from "./http";

const API = "https://api.stripe.com/v1";

/** Stripe n'encaisse pas le franc CFA sur tous les comptes : un montant en XAF est converti en EUR (parité fixe). */
export function stripeAmount(amount: number, currency: Currency): { currency: "eur" | "usd"; unitAmount: number } {
  const cur = currency === "USD" ? "usd" : "eur";
  const value = currency === "XAF" ? convert(amount, "XAF", "EUR") : amount;
  return { currency: cur, unitAmount: Math.round(value * 100) };
}

/** Stripe Checkout : la saisie de carte se fait sur la page hébergée par Stripe (aucune donnée de carte chez nous). */
export class StripeProvider implements PaymentProvider {
  readonly id = "STRIPE" as const;
  readonly simulated = false;
  constructor(private readonly secretKey: string) {}

  private headers() {
    return { Authorization: `Bearer ${this.secretKey}`, "Content-Type": "application/x-www-form-urlencoded" };
  }

  async charge(r: ChargeRequest): Promise<ChargeResult> {
    const { currency, unitAmount } = stripeAmount(r.amount, r.currency);
    const body = new URLSearchParams({
      mode: "payment",
      success_url: r.returnUrl,
      cancel_url: r.cancelUrl,
      client_reference_id: r.reference,
      "metadata[payment_id]": r.paymentId,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": currency,
      "line_items[0][price_data][unit_amount]": String(unitAmount),
      "line_items[0][price_data][product_data][name]": r.description.slice(0, 120),
    });
    const res = await http(`${API}/checkout/sessions`, { method: "POST", headers: { ...this.headers(), "Idempotency-Key": r.paymentId }, body });
    if (!res.ok || !res.body?.url) return { status: "FAILED", reason: res.body?.error?.message ?? "Stripe a refusé la création du paiement." };
    return { status: "PENDING", providerReference: String(res.body.id), redirectUrl: String(res.body.url) };
  }

  async verify(sessionId: string): Promise<VerifyResult> {
    const res = await http(`${API}/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: this.headers() });
    if (!res.ok) return { status: "PENDING" };
    if (res.body?.payment_status === "paid") return { status: "SUCCEEDED" };
    if (res.body?.status === "expired") return { status: "FAILED", reason: "Session de paiement expirée." };
    return { status: "PENDING" };
  }
}

/** Vérifie la signature d'un webhook Stripe (en-tête Stripe-Signature, HMAC-SHA256 de « t.corps », tolérance 5 min). */
export function verifyStripeSignature(rawBody: string, header: string | null, secret: string, now = Date.now()): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(now / 1000 - t) > 300 || !parts.v1) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(parts.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
