import { cfg, loadConfig } from "@/modules/settings/service";
import { db, contactMessages } from "@/db";
import { z } from "zod";
import { env } from "@/shared/env";
import { invalid } from "@/shared/errors";
import { deliver } from "@/modules/notifications/service";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nom requis."),
  email: z.string().trim().email("Adresse e-mail invalide."),
  subject: z.string().trim().min(3, "Sujet requis.").max(150),
  message: z.string().trim().min(10, "Message trop court (10 caractères minimum).").max(4000),
  website: z.string().optional(), // piège à robots : champ invisible, doit rester vide
});

export async function submitContact(raw: unknown) {
  const data = contactSchema.parse(raw);
  if (data.website) return; // robot : on feint le succès sans rien enregistrer
  const count = await db.$count(contactMessages);
  if (count > 5000) throw invalid("Boîte de réception pleine, réessayez plus tard.");
  await db.insert(contactMessages).values({ name: data.name, email: data.email, subject: data.subject, message: data.message });
  await loadConfig();
  const to = env.CONTACT_TO ?? (cfg("agency.email") || undefined);
  if (to) {
    await deliver({ to, subject: `[Contact] ${data.subject}`, text: `${data.name} <${data.email}>\n\n${data.message}`, html: `<p><b>${data.name}</b> &lt;${data.email}&gt;</p><p>${data.message.replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>` });
  }
}

/** Contenu administrable : paragraphes séparés par une ligne vide, « ## » = sous-titre. */
export function parseBody(body: string): { type: "h" | "p"; text: string }[] {
  return body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean).map((b) => (b.startsWith("## ") ? { type: "h" as const, text: b.slice(3) } : { type: "p" as const, text: b }));
}
