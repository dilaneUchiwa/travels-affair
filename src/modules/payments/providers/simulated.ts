import type { ChargeRequest, ChargeResult, PaymentProvider } from "../provider";

/**
 * Simulateur de démonstration — aucun argent réel n'est manipulé.
 *  Carte  : 4242 4242 4242 4242 = accepté ; 4000 0000 0000 0002 = refusé ; autre = refusé.
 *  PayPal : toujours accepté.
 *  Mobile : tout numéro 6XXXXXXXX accepté, sauf ceux finissant par 000 (solde insuffisant).
 */
export class SimulatedProvider implements PaymentProvider {
  readonly id = "SIMULATED" as const;
  readonly simulated = true;

  async charge({ reference, input }: ChargeRequest): Promise<ChargeResult> {
    await new Promise((r) => setTimeout(r, 400)); // latence réaliste
    const ref = `SIM-${reference}-${Date.now().toString(36).toUpperCase()}`;
    if (input.method === "CARD") {
      if (input.cardNumber === "4242424242424242") return { status: "SUCCEEDED", providerReference: ref };
      if (input.cardNumber === "4000000000000002") return { status: "FAILED", reason: "Carte refusée par la banque (simulation)." };
      return { status: "FAILED", reason: "Mode démo : utilisez la carte de test 4242 4242 4242 4242." };
    }
    if (input.method === "PAYPAL") return { status: "SUCCEEDED", providerReference: ref };
    if (input.phone.endsWith("000")) return { status: "FAILED", reason: "Solde insuffisant (simulation)." };
    return { status: "SUCCEEDED", providerReference: ref };
  }
}
