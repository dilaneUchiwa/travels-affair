import { convertRounded } from "@/shared/money";
import type { ChargeRequest, ChargeResult, PaymentProvider, VerifyResult } from "../provider";
import { http } from "./http";

const API = "https://api-checkout.cinetpay.com/v2";

/** CinetPay exige un montant entier multiple de 5 (XAF). */
export function cinetpayAmount(amount: number, currency: string): number {
  const xaf = currency === "XAF" ? amount : convertRounded(amount, currency as "EUR" | "USD", "XAF");
  return Math.max(100, Math.ceil(xaf / 5) * 5);
}

/** L'identifiant de transaction ne doit contenir que des caractères alphanumériques. */
export const cinetpayTransactionId = (paymentId: string) => paymentId.replace(/[^a-zA-Z0-9]/g, "");

/**
 * CinetPay (agrégateur panafricain) : page de paiement hébergée proposant, au Cameroun,
 * Orange Money, MTN Money, Express Union et Visa/Mastercard. Le client est redirigé, puis on vérifie la transaction.
 * NB : non testé contre le service réel (clés de l'agence requises).
 */
export class CinetPayProvider implements PaymentProvider {
  readonly id = "CINETPAY" as const;
  readonly simulated = false;
  constructor(private readonly apikey: string, private readonly siteId: string) {}

  async charge(r: ChargeRequest): Promise<ChargeResult> {
    const transactionId = cinetpayTransactionId(r.paymentId);
    const isCard = r.input.method === "CARD";
    try {
      const res = await http(`${API}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apikey: this.apikey,
          site_id: this.siteId,
          transaction_id: transactionId,
          amount: cinetpayAmount(r.amount, r.currency),
          currency: "XAF",
          description: r.description.replace(/[#/$_&]/g, " ").slice(0, 120),
          notify_url: r.notifyUrl,
          return_url: r.returnUrl,
          channels: isCard ? "CREDIT_CARD" : "MOBILE_MONEY",
          lang: r.lang,
          metadata: r.reference,
          customer_name: r.customer?.name.split(" ")[0] ?? "Client",
          customer_surname: r.customer?.name.split(" ").slice(1).join(" ") || "Travel",
          customer_email: r.customer?.email ?? "",
          customer_phone_number: r.customer?.phone ?? "",
          customer_address: "Yaoundé",
          customer_city: "Yaoundé",
          customer_country: "CM",
          customer_state: "CM",
          customer_zip_code: "00237",
        }),
      });
      const url = res.body?.data?.payment_url;
      if (!res.ok || String(res.body?.code) !== "201" || !url) return { status: "FAILED", reason: String(res.body?.description ?? res.body?.message ?? "Le service de paiement a refusé la demande.") };
      return { status: "PENDING", providerReference: transactionId, redirectUrl: String(url) };
    } catch (e) {
      return { status: "FAILED", reason: e instanceof Error ? e.message : "Erreur CinetPay." };
    }
  }

  async verify(transactionId: string): Promise<VerifyResult> {
    try {
      const res = await http(`${API}/payment/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apikey: this.apikey, site_id: this.siteId, transaction_id: transactionId }),
      });
      const status = String(res.body?.data?.status ?? "").toUpperCase();
      if (String(res.body?.code) === "00" && status === "ACCEPTED") return { status: "SUCCEEDED" };
      if (status === "REFUSED" || status === "CANCELED") return { status: "FAILED", reason: "Paiement refusé ou annulé." };
      return { status: "PENDING" };
    } catch {
      return { status: "PENDING" };
    }
  }
}
