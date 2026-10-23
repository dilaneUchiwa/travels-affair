import { z } from "zod";

export const PAYMENT_METHODS = ["ORANGE_MONEY", "MTN_MOMO", "EXPRESS_UNION", "CARD", "PAYPAL"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const phone = z
  .string()
  .transform((s) => s.replace(/[\s+.-]/g, "").replace(/^237/, ""))
  .pipe(z.string().regex(/^6\d{8}$/, "Numéro Mobile Money invalide (ex. 6 XX XX XX XX)."));

/** Les champs carte ne sont lus que par le simulateur : avec Stripe, la saisie se fait sur la page sécurisée de Stripe. */
export const paymentInputSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("CARD"),
    holder: z.string().trim().optional(),
    cardNumber: z.string().transform((s) => s.replace(/\s/g, "")).optional(),
    expiry: z.string().optional(),
    cvc: z.string().optional(),
  }),
  z.object({ method: z.literal("PAYPAL") }),
  z.object({ method: z.literal("ORANGE_MONEY"), phone }),
  z.object({ method: z.literal("MTN_MOMO"), phone }),
  z.object({ method: z.literal("EXPRESS_UNION"), phone }),
]);

export type PaymentInput = z.infer<typeof paymentInputSchema>;
