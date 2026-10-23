import { env } from "@/shared/env";
import type { PaymentProvider } from "./provider";
import { CinetPayProvider } from "./providers/cinetpay";
import { CampayProvider } from "./providers/campay";
import { PayPalProvider } from "./providers/paypal";
import { SimulatedProvider } from "./providers/simulated";
import { StripeProvider } from "./providers/stripe";
import type { PaymentMethod } from "./schemas";

const simulated = new SimulatedProvider();

/**
 * Point unique de câblage : un moyen de paiement utilise le vrai prestataire si ses clés sont présentes
 * dans l'environnement, sinon le simulateur de démonstration.
 */
export function getProvider(method: PaymentMethod): PaymentProvider {
  // CinetPay couvre Orange Money, MTN Money, Express Union et Visa/Mastercard au Cameroun : prioritaire s'il est configuré.
  if (method !== "PAYPAL" && env.CINETPAY_APIKEY && env.CINETPAY_SITE_ID) return new CinetPayProvider(env.CINETPAY_APIKEY, env.CINETPAY_SITE_ID);
  switch (method) {
    case "EXPRESS_UNION":
      return simulated;
    case "CARD":
      return env.STRIPE_SECRET_KEY ? new StripeProvider(env.STRIPE_SECRET_KEY) : simulated;
    case "PAYPAL":
      return env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET ? new PayPalProvider(env.PAYPAL_CLIENT_ID, env.PAYPAL_CLIENT_SECRET, env.PAYPAL_ENV) : simulated;
    case "ORANGE_MONEY":
    case "MTN_MOMO":
      return env.CAMPAY_USERNAME && env.CAMPAY_PASSWORD ? new CampayProvider(env.CAMPAY_USERNAME, env.CAMPAY_PASSWORD, env.CAMPAY_BASE_URL) : simulated;
  }
}

export const getProviderById = (id: string, method: PaymentMethod): PaymentProvider => {
  const p = getProvider(method);
  return p.id === id ? p : simulated;
};

export const providerInfo = (method: PaymentMethod) => ({ id: getProvider(method).id, simulated: getProvider(method).simulated });
