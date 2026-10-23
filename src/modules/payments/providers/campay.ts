import { convert } from "@/shared/money";
import type { ChargeRequest, ChargeResult, PaymentProvider, VerifyResult } from "../provider";
import { http } from "./http";

/** Mobile Money (MTN MoMo, Orange Money) via l'agrégateur Campay : le client confirme sur son téléphone (USSD). */
export class CampayProvider implements PaymentProvider {
  readonly id = "CAMPAY" as const;
  readonly simulated = false;
  constructor(private readonly username: string, private readonly password: string, private readonly base: string) {}

  private async token(): Promise<string> {
    const res = await http(`${this.base}/api/token/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: this.username, password: this.password }) });
    if (!res.ok || !res.body?.token) throw new Error("Authentification de l'agrégateur Mobile Money refusée (vérifiez les clés).");
    return String(res.body.token);
  }

  async charge(r: ChargeRequest): Promise<ChargeResult> {
    if (r.input.method !== "ORANGE_MONEY" && r.input.method !== "MTN_MOMO") return { status: "FAILED", reason: "Moyen de paiement incompatible." };
    try {
      const amount = r.currency === "XAF" ? r.amount : Math.round(convert(r.amount, r.currency, "XAF")); // Mobile Money : XAF uniquement
      const res = await http(`${this.base}/api/collect/`, {
        method: "POST",
        headers: { Authorization: `Token ${await this.token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount: String(amount), currency: "XAF", from: `237${r.input.phone}`, description: r.description.slice(0, 100), external_reference: r.paymentId }),
      });
      if (!res.ok || !res.body?.reference) return { status: "FAILED", reason: res.body?.message ?? "L'opérateur a refusé la demande de paiement." };
      return { status: "PENDING", providerReference: String(res.body.reference) };
    } catch (e) {
      return { status: "FAILED", reason: e instanceof Error ? e.message : "Erreur Mobile Money." };
    }
  }

  async verify(reference: string): Promise<VerifyResult> {
    try {
      const res = await http(`${this.base}/api/transaction/${encodeURIComponent(reference)}/`, { headers: { Authorization: `Token ${await this.token()}` } });
      const status = String(res.body?.status ?? "").toUpperCase();
      if (status === "SUCCESSFUL") return { status: "SUCCEEDED" };
      if (status === "FAILED") return { status: "FAILED", reason: "Paiement refusé ou non confirmé sur le téléphone." };
      return { status: "PENDING" };
    } catch {
      return { status: "PENDING" };
    }
  }
}
