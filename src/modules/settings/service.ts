import "server-only";
import { db, settings } from "@/db";
import { invalid } from "@/shared/errors";
import { applyMoneyConfig, CURRENCIES, type Currency, isCurrency } from "@/shared/money";
import { DEFAULTS, PAYMENT_METHODS, SETTINGS, type SettingDef } from "./definitions";

export type Config = Record<string, string>;

let snapshot: Config = { ...DEFAULTS };
let loadedAt = 0;

function apply(c: Config) {
  snapshot = c;
  applyMoneyConfig({
    rates: { EUR: Number(c["rate.EUR"]) || 655.957, USD: Number(c["rate.USD"]) || 600 },
    enabled: csv(c["currency.enabled"]).filter(isCurrency),
    defaults: { fr: asCurrency(c["currency.defaultFr"], "XAF"), en: asCurrency(c["currency.defaultEn"], "EUR") },
  });
}

const csv = (v: string) => v.split(",").map((x) => x.trim()).filter(Boolean);
const asCurrency = (v: string, fallback: Currency): Currency => (isCurrency(v) ? v : fallback);

/** Charge la configuration (cache de 3 s) et l'applique (taux, devises). À appeler au début d'une requête. */
export async function loadConfig(force = false): Promise<Config> {
  if (!force && Date.now() - loadedAt < 3000) return snapshot;
  const rows = await db.select().from(settings);
  const c: Config = { ...DEFAULTS };
  for (const r of rows) if (r.key in DEFAULTS) c[r.key] = r.value;
  loadedAt = Date.now();
  apply(c);
  return c;
}

/** Surcharges issues des variables d'environnement NEXT_PUBLIC_AGENCY_* (personnalisation démo). */
const ENV_OVERRIDES: Record<string, string | undefined> = {
  "agency.name":    process.env.NEXT_PUBLIC_AGENCY_NAME,
  "agency.phone":   process.env.NEXT_PUBLIC_AGENCY_PHONE,
  "agency.email":   process.env.NEXT_PUBLIC_AGENCY_EMAIL,
  "agency.address": process.env.NEXT_PUBLIC_AGENCY_ADDRESS,
};

/** Dernière configuration chargée (usage synchrone dans les composants serveur ; voir loadConfig). */
export const config = (): Config => snapshot;
export const cfg = (key: string): string => ENV_OVERRIDES[key] || (snapshot[key] ?? DEFAULTS[key] ?? "");
export const cfgList = (key: string) => csv(cfg(key));

export function validate(def: SettingDef, raw: string): string {
  const v = raw.trim();
  if (def.type === "number") {
    const n = Number(v.replace(",", "."));
    if (!Number.isFinite(n) || n < (def.min ?? 0)) throw invalid(`« ${def.label} » : nombre invalide (minimum ${def.min ?? 0}).`);
    return String(n);
  }
  if (def.type === "email" && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) throw invalid(`« ${def.label} » : adresse e-mail invalide.`);
  if (def.type === "select" && !def.options?.some((o) => o.value === v)) throw invalid(`« ${def.label} » : valeur invalide.`);
  if (def.key === "booking.reminders") {
    const nums = csv(v).map(Number);
    if (nums.length === 0 || nums.some((n) => !Number.isFinite(n) || n <= 0)) throw invalid("Rappels : indiquez des minutes positives séparées par des virgules (ex. 1440,30).");
  }
  if (def.key === "agency.facebook" || def.key === "agency.instagram") if (v && !/^https?:\/\//.test(v)) throw invalid(`« ${def.label} » : l'adresse doit commencer par https://`);
  return v;
}

export async function saveConfig(fd: FormData) {
  const values: Config = {};
  for (const def of SETTINGS) {
    values[def.key] = def.type === "multi" ? fd.getAll(def.key).map(String).filter((x) => def.options?.some((o) => o.value === x)).join(",") : validate(def, String(fd.get(def.key) ?? ""));
  }
  const enabled = csv(values["currency.enabled"]);
  if (enabled.length === 0) throw invalid("Activez au moins une devise.");
  for (const k of ["currency.defaultFr", "currency.defaultEn"]) if (!enabled.includes(values[k])) throw invalid("Chaque devise par défaut doit faire partie des devises proposées.");
  if (csv(values["payment.methods"]).length === 0) throw invalid("Activez au moins un moyen de paiement.");
  await db.transaction(async (tx) => {
    for (const [key, value] of Object.entries(values)) {
      await tx.insert(settings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
    }
  });
  await loadConfig(true);
}

export const enabledPaymentMethods = () => cfgList("payment.methods").filter((m) => PAYMENT_METHODS.some((p) => p.value === m));
export { CURRENCIES };
