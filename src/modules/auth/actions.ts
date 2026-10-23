"use server";

import { redirect } from "next/navigation";
import { attempt, safeNext, type FormState } from "@/shared/action";
import { getLang } from "@/i18n/server";
import { authenticate, registerUser, requestPasswordReset, resetPassword } from "./service";
import { endSession, startSession } from "./session";

export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  const result = await attempt(async () => {
    const user = await registerUser(Object.fromEntries(fd), getLang());
    await startSession(user);
  });
  if (!result.ok) return { error: result.error };
  redirect(safeNext(fd.get("next"), "/mon-compte"));
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const result = await attempt(async () => {
    const user = await authenticate(Object.fromEntries(fd));
    await startSession(user);
    return user;
  });
  if (!result.ok) return { error: result.error };
  const target = safeNext(fd.get("next"), result.data.role === "ADMIN" ? "/admin" : "/mon-compte");
  if (target.startsWith("/admin")) return { redirectTo: target };
  redirect(target);
}

export async function logoutAction() {
  endSession();
  redirect("/");
}

export async function forgotPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const result = await attempt(() => requestPasswordReset(Object.fromEntries(fd)));
  if (!result.ok) return { error: result.error };
  redirect("/mot-de-passe-oublie?envoye=1");
}

export async function resetPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const result = await attempt(() => resetPassword(Object.fromEntries(fd)));
  if (!result.ok) return { error: result.error };
  redirect("/connexion?reinit=1");
}
