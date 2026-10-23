"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { attempt, type FormState } from "@/shared/action";
import { requireAdmin } from "@/modules/auth/session";
import { createRow, deleteRow, toggleRow, updateRow } from "./service";
import { getEntity } from "./entities";

const entityOf = (fd: FormData) => {
  const e = getEntity(String(fd.get("__entity") ?? ""));
  if (!e) throw new Error("Ressource inconnue.");
  return e;
};

function refresh(key: string) {
  revalidatePath(`/admin/${key}`);
  for (const p of ["/vols", "/hotels", "/transports", "/voitures", "/activites", "/agence", "/faq", "/infos-pratiques"]) revalidatePath(p);
}

export async function saveEntityAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const e = entityOf(fd);
  const id = String(fd.get("__id") ?? "");
  const result = await attempt(() => (id ? updateRow(e, id, fd) : createRow(e, fd)));
  if (!result.ok) return { error: result.error };
  refresh(e.key);
  redirect(`/admin/${e.key}`);
}

export async function toggleEntityAction(fd: FormData) {
  await requireAdmin();
  const e = entityOf(fd);
  await attempt(() => toggleRow(e, String(fd.get("__id"))));
  refresh(e.key);
}

export async function deleteEntityAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const e = entityOf(fd);
  const result = await attempt(() => deleteRow(e, String(fd.get("__id"))));
  if (!result.ok) return { error: result.error };
  refresh(e.key);
  redirect(`/admin/${e.key}`);
}
