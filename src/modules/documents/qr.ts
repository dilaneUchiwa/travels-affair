import { createHmac, timingSafeEqual } from "node:crypto";
import QRCode from "qrcode";
import { env, getAuthSecret } from "@/shared/env";

type Qrable = { reference: string };

/** Jeton court et infalsifiable lié à la référence (empêche de deviner l'adresse de vérification d'une autre réservation). */
export function verificationToken(reference: string): string {
  return createHmac("sha256", getAuthSecret()).update(`verify:${reference}`).digest("hex").slice(0, 16);
}

export function verifyToken(reference: string, token: string): boolean {
  const a = Buffer.from(verificationToken(reference)), b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Le QR code encode l'adresse publique de vérification : n'importe quel téléphone peut le scanner. */
export const bookingQrPayload = (b: Qrable) => `${env.APP_URL.replace(/\/$/, "")}/verifier/${b.reference}?t=${verificationToken(b.reference)}`;

export const bookingQrDataUrl = (b: Qrable): Promise<string> =>
  QRCode.toDataURL(bookingQrPayload(b), { margin: 1, width: 240, errorCorrectionLevel: "M" });
