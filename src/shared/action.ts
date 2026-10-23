import { ZodError } from "zod";
import { AppError } from "./errors";

/**
 * État renvoyé aux formulaires (useFormState). `undefined` = pas d'erreur.
 * `redirectTo` : navigation complète côté client, nécessaire pour passer d'un « root layout » à un autre
 * (site public → administration), que `redirect()` d'une Server Action ne sait pas traverser.
 */
export type FormState = { error?: string; redirectTo?: string } | undefined;

export type Attempt<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Exécute un cas d'usage et convertit les erreurs en message affichable.
 * Les Server Actions appellent `redirect()` APRÈS cet appel (redirect lève une exception interne).
 */
export async function attempt<T>(fn: () => Promise<T>): Promise<Attempt<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof AppError) return { ok: false, error: e.message };
    if (e instanceof ZodError) return { ok: false, error: e.issues[0]?.message ?? "Données invalides." };
    console.error("[action] erreur inattendue", e);
    return { ok: false, error: "Une erreur inattendue est survenue. Veuillez réessayer." };
  }
}

/** Retourne un chemin interne sûr (anti open-redirect) ou la valeur par défaut. */
export function safeNext(value: FormDataEntryValue | string | null | undefined, fallback: string): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}
