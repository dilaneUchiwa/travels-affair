import { NextResponse } from "next/server";
import { searchActivities, searchHotels, searchTransports, searchVehicles } from "@/modules/catalog/public";
import { searchFlights } from "@/modules/flights/service";

export const dynamic = "force-dynamic";

/**
 * API publique en lecture seule (offres publiées) : GET /api/v1/{flights|hotels|transports|vehicles|activities}
 * Mêmes filtres que le site (from, to, date, q, location…). Sert de base à une future application mobile.
 */
export async function GET(req: Request, { params }: { params: { resource: string } }) {
  const q = Object.fromEntries(new URL(req.url).searchParams);
  const data =
    params.resource === "flights" ? await searchFlights(q)
    : params.resource === "hotels" ? await searchHotels(q)
    : params.resource === "transports" ? await searchTransports(q)
    : params.resource === "vehicles" ? await searchVehicles(q)
    : params.resource === "activities" ? await searchActivities(q)
    : null;
  if (!data) return NextResponse.json({ error: "Ressource inconnue" }, { status: 404 });
  return NextResponse.json({ data }, { headers: { "Cache-Control": "public, max-age=60" } });
}
