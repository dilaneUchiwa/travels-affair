import type { MetadataRoute } from "next";
import { and, eq, gt } from "drizzle-orm";
import { activities, db, flights, hotels, transports, vehicles } from "@/db";
import { env } from "@/shared/env";

export const dynamic = "force-dynamic";

/** Plan du site : pages fixes + fiches d'offres publiées (les crawlers le découvrent via robots.txt). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base = env.APP_URL.replace(/\/$/, "");
  const fixed = ["", "/vols", "/hotels", "/transports", "/voitures", "/activites", "/agence", "/infos-pratiques", "/faq", "/contact"].map((p) => ({
    url: `${base}${p}`, lastModified: now, changeFrequency: p === "" || p === "/vols" ? ("daily" as const) : ("weekly" as const), priority: p === "" ? 1 : 0.7,
  }));
  const [f, h, t, v, a] = await Promise.all([
    db.select({ id: flights.id }).from(flights).where(and(eq(flights.status, "PUBLISHED"), gt(flights.departAt, now))),
    db.select({ id: hotels.id }).from(hotels).where(eq(hotels.status, "PUBLISHED")),
    db.select({ id: transports.id }).from(transports).where(and(eq(transports.status, "PUBLISHED"), gt(transports.departAt, now))),
    db.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.status, "PUBLISHED")),
    db.select({ id: activities.id }).from(activities).where(and(eq(activities.status, "PUBLISHED"), gt(activities.startAt, now))),
  ]);
  const entries = (path: string, rows: { id: string }[]) => rows.map((r) => ({ url: `${base}${path}/${r.id}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 }));
  return [...fixed, ...entries("/vols", f), ...entries("/hotels", h), ...entries("/transports", t), ...entries("/voitures", v), ...entries("/activites", a)];
}
