"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { attempt, type FormState } from "@/shared/action";
import { requireAdmin } from "@/modules/auth/session";
import { saveConfig } from "./service";

export async function saveConfigAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const r = await attempt(() => saveConfig(fd));
  if (!r.ok) return { error: r.error };
  revalidatePath("/", "layout");
  redirect("/admin/configuration?ok=1");
}
