"use server";

import { getCurrency } from "@/shared/price";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { attempt, type FormState } from "@/shared/action";
import { requireAdmin, requireUser } from "@/modules/auth/session";
import { cancelOwnPending, changeStatus, createBooking } from "./service";
import { OFFER_PATHS, isServiceType } from "./service-types";

export async function createBookingAction(_: FormState, fd: FormData): Promise<FormState> {
  const type = String(fd.get("serviceType") ?? "");
  const itemId = String(fd.get("itemId") ?? "");
  const user = await requireUser(isServiceType(type) ? `${OFFER_PATHS[type]}/${itemId}` : "/");
  const result = await attempt(() => createBooking(user.id, Object.fromEntries(fd), { currency: getCurrency() }));
  if (!result.ok) return { error: result.error };
  redirect(`/reservation/${result.data.id}/paiement`);
}

export async function cancelBookingAction(fd: FormData) {
  const user = await requireUser();
  await attempt(() => cancelOwnPending(user, String(fd.get("bookingId"))));
  revalidatePath("/mon-compte");
}

export async function adminChangeStatusAction(fd: FormData) {
  await requireAdmin();
  await attempt(() => changeStatus(String(fd.get("bookingId")), String(fd.get("status"))));
  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
}
