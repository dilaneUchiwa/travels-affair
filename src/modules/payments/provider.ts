import type { Currency } from "@/shared/money";
import type { PaymentInput } from "./schemas";

export type ChargeRequest = {
  reference: string; // référence de réservation (ex. TA-XXXXXX)
  paymentId: string; // identifiant de la tentative (clé d'idempotence côté prestataire)
  amount: number;
  currency: Currency;
  description: string;
  input: PaymentInput;
  returnUrl: string; // retour après paiement (Stripe, PayPal)
  cancelUrl: string;
  notifyUrl: string; // notification serveur à serveur (CinetPay)
  lang: "fr" | "en";
  customer?: { name: string; email: string; phone?: string };
};

export type ChargeResult =
  | { status: "SUCCEEDED"; providerReference: string }
  | { status: "FAILED"; reason: string }
  /** Paiement lancé mais non terminé : redirection vers le prestataire, ou confirmation sur le téléphone. */
  | { status: "PENDING"; providerReference: string; redirectUrl?: string };

export type VerifyResult = { status: "SUCCEEDED" | "PENDING" } | { status: "FAILED"; reason: string };

/**
 * Port de sortie du module paiements. Un prestataire = une classe qui implémente cette interface
 * et qui est choisie dans registry.ts selon les clés présentes dans l'environnement.
 */
export interface PaymentProvider {
  readonly id: "SIMULATED" | "STRIPE" | "PAYPAL" | "CAMPAY" | "CINETPAY";
  readonly simulated: boolean;
  charge(request: ChargeRequest): Promise<ChargeResult>;
  /** Interroge le prestataire sur un paiement PENDING (retour de redirection, vérification manuelle, tâche planifiée). */
  verify?(providerReference: string): Promise<VerifyResult>;
}
