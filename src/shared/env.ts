import { z } from "zod";

const blank = (v: unknown) => (v === "" ? undefined : v);

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  APP_URL: z.preprocess(blank, z.string().url().default("http://localhost:3000")),
  AUTH_SECRET: z.preprocess(blank, z.string().min(16).optional()),
  SMTP_HOST: z.preprocess(blank, z.string().optional()),
  SMTP_PORT: z.preprocess(blank, z.coerce.number().int().default(587)),
  SMTP_USER: z.preprocess(blank, z.string().optional()),
  SMTP_PASS: z.preprocess(blank, z.string().optional()),
  MAIL_FROM: z.preprocess(blank, z.string().default("Travel's Affair <no-reply@travels-affair.com>")),
  CRON_SECRET: z.preprocess(blank, z.string().optional()),
  CONTACT_TO: z.preprocess(blank, z.string().email().optional()), // e-mail de l'agence recevant les messages du formulaire de contact
  // Échéances de rappel avant le départ, en minutes, séparées par des virgules (défaut : 24 h et 30 min).
  REMINDER_MINUTES: z.preprocess(
    blank,
    z
      .string()
      .default("1440,30")
      .transform((v) => v.split(",").map((x) => Number(x.trim())).filter((n) => Number.isFinite(n) && n > 0)),
  ),
  // Passerelles de paiement : chaque jeu de clés active le prestataire correspondant (sinon : simulation de démonstration).
  STRIPE_SECRET_KEY: z.preprocess(blank, z.string().optional()),
  STRIPE_WEBHOOK_SECRET: z.preprocess(blank, z.string().optional()),
  PAYPAL_CLIENT_ID: z.preprocess(blank, z.string().optional()),
  PAYPAL_CLIENT_SECRET: z.preprocess(blank, z.string().optional()),
  PAYPAL_ENV: z.preprocess(blank, z.enum(["sandbox", "live"]).default("sandbox")),
  CAMPAY_USERNAME: z.preprocess(blank, z.string().optional()), // agrégateur Mobile Money (MTN MoMo et Orange Money, Cameroun)
  CAMPAY_PASSWORD: z.preprocess(blank, z.string().optional()),
  CAMPAY_BASE_URL: z.preprocess(blank, z.string().url().default("https://demo.campay.net")),
  CINETPAY_APIKEY: z.preprocess(blank, z.string().optional()), // CinetPay : Orange Money, MTN MoMo, Express Union, Visa/Mastercard (Cameroun)
  CINETPAY_SITE_ID: z.preprocess(blank, z.string().optional()),
  CINETPAY_SECRET_KEY: z.preprocess(blank, z.string().optional()),
  PENDING_PAYMENT_TTL_MINUTES: z.preprocess(blank, z.coerce.number().positive().default(30)),
});

export const env = schema.parse(process.env);

/** Lu paresseusement pour ne pas casser `next build` ; obligatoire en production. */
export function getAuthSecret(): Uint8Array {
  const secret = env.AUTH_SECRET;
  if (!secret) {
    if (env.NODE_ENV === "production") throw new Error("AUTH_SECRET est obligatoire en production.");
    return new TextEncoder().encode("dev-only-secret-do-not-use-in-production");
  }
  return new TextEncoder().encode(secret);
}
