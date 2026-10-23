import { notFound } from "@/shared/errors";
import * as repo from "./repository";
import { searchSchema } from "./schemas";

export const searchFlights = async (raw: Record<string, unknown>) => repo.withAirlines(await repo.searchPublished(searchSchema.parse(raw)));
export const featuredFlights = async (limit = 6) => repo.withAirlines(await repo.featured(limit));

/** Un vol brouillon ou passé n'est pas visible côté public. */
export async function getPublicFlight(id: string) {
  const flight = await repo.findById(id);
  if (!flight || flight.status !== "PUBLISHED") throw notFound("Ce vol n'existe pas ou n'est plus disponible.");
  return (await repo.withAirlines([flight]))[0];
}
