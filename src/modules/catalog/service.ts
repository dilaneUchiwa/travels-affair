import "server-only";
import { eq, getTableColumns, sql } from "drizzle-orm";
import { z, type ZodTypeAny } from "zod";
import { db } from "@/db";
import { CURRENCIES } from "@/shared/money";
import { doualaDate } from "@/shared/zod";
import { conflict, invalid, notFound } from "@/shared/errors";
import { MAX_PHOTOS, parsePhotos, saveImages } from "@/modules/uploads/service";
import type { Entity, Field } from "./types";

const idCol = (e: Entity) => {
  const col = (getTableColumns(e.table) as Record<string, never>)[e.idColumn ?? "id"];
  if (!col) throw new Error(`Colonne identifiant absente : ${e.key}`);
  return col;
};

function fieldSchema(f: Field): ZodTypeAny {
  switch (f.kind) {
    case "text":
    case "textarea": {
      const s = z.string().trim();
      return f.required ? s.min(1, `${f.label} requis.`) : s.default("");
    }
    case "datetime":
      return f.required
        ? doualaDate(`${f.label} invalide.`)
        : z.preprocess((v) => (v === "" || v == null ? null : v), doualaDate(`${f.label} invalide.`).nullable());
    case "number":
      return z.coerce.number({ invalid_type_error: `${f.label} invalide.` }).int(`${f.label} : entier requis.`).min(f.min ?? 0, `${f.label} : minimum ${f.min ?? 0}.`).max(f.max ?? 1_000_000_000, `${f.label} : maximum ${f.max}.`);
    case "select": {
      const e = z.enum(f.options.map((o) => o.value) as [string, ...string[]], { errorMap: () => ({ message: `${f.label} invalide.` }) });
      return f.asBoolean ? e.transform((v) => v === "1") : e;
    }
    case "relation":
      return z.string().min(1, `${f.label} requis.`);
    case "currency":
      return z.enum(CURRENCIES, { errorMap: () => ({ message: "Devise invalide." }) });
    case "photos":
      return z.string().default("[]");
  }
}

export function buildSchema(e: Entity) {
  return z.object(Object.fromEntries(e.fields.map((f) => [f.name, fieldSchema(f)])));
}

/** Photos finales = photos conservées + nouvelles images téléversées. */
async function mergePhotos(fd: FormData, current: string[], max = MAX_PHOTOS): Promise<string> {
  const removed = new Set(fd.getAll("photos__remove").map(String));
  const kept = current.filter((u) => !removed.has(u));
  const files = fd.getAll("photos__new").filter((v): v is File => v instanceof File && v.size > 0);
  const added = await saveImages(files);
  const all = [...kept, ...added];
  if (all.length > max) throw invalid(max === 1 ? "Un seul logo : retirez l'ancien avant d'en ajouter un autre." : `${max} photos maximum.`);
  return JSON.stringify(all);
}

async function parse(e: Entity, fd: FormData, currentPhotos: string[]) {
  const raw: Record<string, unknown> = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string"));
  const pf = e.fields.find((f) => f.kind === "photos");
  if (pf) raw[pf.name] = await mergePhotos(fd, currentPhotos, pf.name === "logo" ? 1 : MAX_PHOTOS);
  const data = buildSchema(e).parse(raw) as Record<string, unknown>;
  e.refine?.(data);
  await e.beforeSave?.(data);
  return data;
}

export const listRows = (e: Entity) => e.rows();

export async function getRow(e: Entity, id: string) {
  const [row] = await db.select().from(e.table).where(eq(idCol(e), id as never)).limit(1);
  if (!row) throw notFound("Élément introuvable.");
  return row as Record<string, unknown>;
}

export async function createRow(e: Entity, fd: FormData) {
  if (e.noCreate) throw invalid("Création non autorisée pour cette ressource.");
  const data = await parse(e, fd, []);
  await db.insert(e.table).values(data as never);
}

export async function updateRow(e: Entity, id: string, fd: FormData) {
  const current = await getRow(e, id);
  const data = await parse(e, fd, parsePhotos(String(current[(e.fields.find((f) => f.kind === "photos")?.name ?? "photos")] ?? "[]")));
  await db.update(e.table).set(data as never).where(eq(idCol(e), id as never));
}

export async function toggleRow(e: Entity, id: string) {
  if (!e.publishable) throw invalid("Cette ressource ne se publie pas.");
  const current = await getRow(e, id);
  await db.update(e.table).set({ status: current.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" } as never).where(eq(idCol(e), id as never));
}

export async function deleteRow(e: Entity, id: string) {
  if (e.noDelete) throw invalid("Suppression non autorisée.");
  await getRow(e, id);
  if (e.bookingsCount && (await e.bookingsCount(id)) > 0) throw conflict("Cette offre a déjà des réservations : dépubliez-la plutôt que de la supprimer.");
  try {
    await db.delete(e.table).where(eq(idCol(e), id as never));
  } catch {
    throw conflict("Suppression impossible : cet élément est utilisé ailleurs.");
  }
}

/** Nombre d'offres publiées / total par ressource publiable (tableau de bord). */
export async function offerCounts() {
  const { ENTITIES } = await import("./entities");
  const out: { key: string; title: string; published: number; total: number }[] = [];
  for (const e of ENTITIES.filter((x) => x.publishable)) {
    const cols = getTableColumns(e.table) as Record<string, never>;
    const [r] = await db
      .select({ total: sql<number>`count(*)`, published: sql<number>`coalesce(sum(case when ${cols.status} = 'PUBLISHED' then 1 else 0 end), 0)` })
      .from(e.table);
    out.push({ key: e.key, title: e.title, published: Number(r?.published ?? 0), total: Number(r?.total ?? 0) });
  }
  return out;
}
