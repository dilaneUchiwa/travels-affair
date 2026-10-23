const TZ = "Africa/Douala";

export type Lang = "fr" | "en";
const LOCALES: Record<Lang, string> = { fr: "fr-FR", en: "en-GB" };

export function formatDateTime(d: Date, lang: Lang = "fr"): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { dateStyle: "medium", timeStyle: "short", timeZone: TZ }).format(d);
}

export function formatDate(d: Date, lang: Lang = "fr"): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { dateStyle: "long", timeZone: TZ }).format(d);
}

export function formatTime(d: Date, lang: Lang = "fr"): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { timeStyle: "short", timeZone: TZ }).format(d);
}

export function formatDuration(from: Date, to: Date): string {
  const minutes = Math.max(0, Math.round((to.getTime() - from.getTime()) / 60000));
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

/** Valeur pour <input type="datetime-local"> */
export function toInputValue(d: Date): string {
  return new Date(d.getTime() + 3_600_000).toISOString().slice(0, 16); // heure de Douala (UTC+1)
}

/** Instant correspondant à un jour calendaire (AAAA-MM-JJ) à une heure donnée, heure de Douala (UTC+1). */
export function dayAt(day: string, hour: number): Date {
  return new Date(`${day}T${String(hour).padStart(2, "0")}:00:00+01:00`);
}

/** Jour calendaire courant à Douala (AAAA-MM-JJ). */
export function todayInDouala(now = new Date()): string {
  return new Date(now.getTime() + 3_600_000).toISOString().slice(0, 10);
}

export function daysBetween(fromDay: string, toDay: string): number {
  return Math.round((Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) / 86_400_000);
}
