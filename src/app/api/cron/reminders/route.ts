import { NextResponse } from "next/server";
import { expireStaleBookings, sendDueReminders } from "@/modules/bookings/service";
import { failStalePending, refreshAllPending } from "@/modules/payments/service";
import { env } from "@/shared/env";

export const dynamic = "force-dynamic";

/**
 * Tâche planifiée : à appeler toutes les 5 minutes avec `Authorization: Bearer $CRON_SECRET`
 * (une fréquence de 5 min est nécessaire pour un rappel « 30 minutes avant le départ »).
 * Ordre : paiements en attente → expiration des réservations impayées → rappels.
 */
export async function GET(req: Request) {
  if (!env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const checked = await refreshAllPending();
  await failStalePending();
  const expired = await expireStaleBookings();
  const reminded = await sendDueReminders();
  return NextResponse.json({ checked, expired, reminded });
}
