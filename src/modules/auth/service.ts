import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { db, passwordResets, users } from "@/db";
import { makeT } from "@/i18n";
import { env } from "@/shared/env";
import { deliver } from "@/modules/notifications/service";
import { conflict, invalid } from "@/shared/errors";
import { forgotSchema, loginSchema, registerSchema, resetSchema } from "./schemas";

export async function registerUser(input: unknown, lang: "fr" | "en" = "fr") {
  const data = registerSchema.parse(input);
  const existing = await db.query.users.findFirst({ where: eq(users.email, data.email) });
  if (existing) throw conflict("Un compte existe déjà avec cet e-mail.");
  const id = crypto.randomUUID();
  await db
    .insert(users)
    .values({ id, name: data.name, email: data.email, lang, passwordHash: await bcrypt.hash(data.password, 10) });
  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!user) throw new Error("Utilisateur introuvable après création.");
  return user;
}

export async function authenticate(input: unknown) {
  const data = loginSchema.parse(input);
  const user = await db.query.users.findFirst({ where: eq(users.email, data.email) });
  // Même message pour e-mail inconnu et mot de passe faux (pas d'énumération de comptes).
  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    throw invalid("E-mail ou mot de passe incorrect.");
  }
  return user;
}

const RESET_TTL_MS = 60 * 60 * 1000;
const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

/** Demande de réinitialisation. Répond toujours pareil (ne révèle pas si l'e-mail a un compte). */
export async function requestPasswordReset(input: unknown) {
  const { email } = forgotSchema.parse(input);
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) return;
  await db.delete(passwordResets).where(and(eq(passwordResets.userId, user.id), isNull(passwordResets.usedAt)));
  const token = randomBytes(32).toString("hex");
  await db.insert(passwordResets).values({ userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) });
  const t = makeT(user.lang === "en" ? "en" : "fr");
  const link = `${env.APP_URL}/mot-de-passe/reinitialiser?token=${token}`;
  const text = `${t("mail.hello", { name: user.name })}\n\n${t("mail.reset.intro")}\n${link}\n\n${t("mail.reset.ignore")}\n\n${t("mail.signature")}`;
  await deliver({
    to: user.email,
    subject: t("mail.reset.subject"),
    text,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#12263a"><h2 style="color:#0b6e75">Travel's Affair</h2><p>${t("mail.hello", { name: user.name })}</p><p>${t("mail.reset.intro")}</p><p><a href="${link}" style="background:#0b6e75;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">${t("mail.reset.cta")}</a></p><p style="color:#667788">${t("mail.reset.ignore")}</p></div>`,
  });
}

export async function resetPassword(input: unknown) {
  const data = resetSchema.parse(input);
  const row = await db.query.passwordResets.findFirst({
    where: and(eq(passwordResets.tokenHash, sha256(data.token)), isNull(passwordResets.usedAt), gt(passwordResets.expiresAt, new Date())),
  });
  if (!row) throw invalid("Lien invalide ou expiré.");
  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash: await bcrypt.hash(data.password, 10) }).where(eq(users.id, row.userId));
    await tx.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.id, row.id));
  });
}
