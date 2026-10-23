import type { MetadataRoute } from "next";
import { env } from "@/shared/env";

export default function robots(): MetadataRoute.Robots {
  const base = env.APP_URL.replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/mon-compte", "/reservation", "/connexion", "/inscription", "/mot-de-passe"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
