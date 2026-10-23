"use server";

import { redirect } from "next/navigation";
import { attempt, type FormState } from "@/shared/action";
import { submitContact } from "./service";

export async function contactAction(_: FormState, fd: FormData): Promise<FormState> {
  const result = await attempt(() => submitContact(Object.fromEntries(fd)));
  if (!result.ok) return { error: result.error };
  redirect("/contact?envoye=1");
}
