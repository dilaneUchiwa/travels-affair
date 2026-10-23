import { convert, type Currency } from "@/shared/money";
import type { ChargeRequest, ChargeResult, PaymentProvider, VerifyResult } from "../provider";
import { http } from "./http";

/** PayPal : EUR et USD uniquement ; un montant en XAF est converti en EUR (parité fixe). */
export function paypalAmount(amount: number, currency: Currency): { code: "EUR" | "USD"; value: string } {
  const code = currency === "USD" ? "USD" : "EUR";
  const value = currency === "XAF" ? convert(amount, "XAF", "EUR") : amount;
  return { code, value: value.toFixed(2) };
}

export class PayPalProvider implements PaymentProvider {
  readonly id = "PAYPAL" as const;
  readonly simulated = false;
  private readonly base: string;
  constructor(private readonly clientId: string, private readonly secret: string, env: "sandbox" | "live") {
    this.base = env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  }

  private async token(): Promise<string> {
    const res = await http(`${this.base}/v1/oauth2/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    if (!res.ok || !res.body?.access_token) throw new Error("Authentification PayPal refusée (vérifiez les clés).");
    return String(res.body.access_token);
  }

  async charge(r: ChargeRequest): Promise<ChargeResult> {
    try {
      const token = await this.token();
      const { code, value } = paypalAmount(r.amount, r.currency);
      const res = await http(`${this.base}/v2/checkout/orders`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "PayPal-Request-Id": r.paymentId },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{ reference_id: r.reference, custom_id: r.paymentId, description: r.description.slice(0, 120), amount: { currency_code: code, value } }],
          payment_source: { paypal: { experience_context: { return_url: r.returnUrl, cancel_url: r.cancelUrl, user_action: "PAY_NOW" } } },
        }),
      });
      const links = (res.body?.links ?? []) as { rel: string; href: string }[];
      const approve = links.find((l) => l.rel === "payer-action" || l.rel === "approve");
      if (!res.ok || !approve) return { status: "FAILED", reason: res.body?.message ?? "PayPal a refusé la création du paiement." };
      return { status: "PENDING", providerReference: String(res.body!.id), redirectUrl: approve.href };
    } catch (e) {
      return { status: "FAILED", reason: e instanceof Error ? e.message : "Erreur PayPal." };
    }
  }

  /** Après approbation par le client, la commande doit être « capturée » pour que l'argent soit débité. */
  async verify(orderId: string): Promise<VerifyResult> {
    try {
      const token = await this.token();
      const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const order = await http(`${this.base}/v2/checkout/orders/${encodeURIComponent(orderId)}`, { headers: auth });
      const status = order.body?.status;
      if (status === "COMPLETED") return { status: "SUCCEEDED" };
      if (status === "VOIDED") return { status: "FAILED", reason: "Paiement PayPal annulé." };
      if (status === "APPROVED") {
        const cap = await http(`${this.base}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, { method: "POST", headers: auth, body: "{}" });
        if (cap.body?.status === "COMPLETED") return { status: "SUCCEEDED" };
        return { status: "FAILED", reason: "Capture PayPal refusée." };
      }
      return { status: "PENDING" };
    } catch {
      return { status: "PENDING" };
    }
  }
}
