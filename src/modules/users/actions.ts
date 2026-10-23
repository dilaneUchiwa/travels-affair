"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, users } from "@/db";
import { requireAdmin } from "@/modules/auth/session";

const ROLES = ["CLIENT", "ADMIN"];

/** Change le rôle d'un utilisateur. Un administrateur ne peut pas se rétrograder lui-même (anti-verrouillage). */
export async function adminSetUserRoleAction(fd: FormData) {
  const admin = await requireAdmin();
  const userId = String(fd.get("userId") ?? "");
  const role = String(fd.get("role") ?? "");
  if (!userId || !ROLES.includes(role)) return;
  if (userId === admin.id && role !== "ADMIN") return; // ne pas se retirer ses propres droits
  await db.update(users).set({ role }).where(eq(users.id, userId));
  revalidatePath("/admin/utilisateurs");
}
