export const SERVICE_TYPES = ["FLIGHT", "HOTEL", "TRANSPORT", "CAR", "ACTIVITY"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];
export const isServiceType = (v: string): v is ServiceType => (SERVICE_TYPES as readonly string[]).includes(v);

/** Statuts qui comptent dans la disponibilité (hôtels, voitures). */
export const INACTIVE_STATUSES = ["CANCELLED", "REFUNDED"] as const;

/** Chemin public de la fiche d'une offre. */
export const OFFER_PATHS: Record<ServiceType, string> = {
  FLIGHT: "/vols",
  HOTEL: "/hotels",
  TRANSPORT: "/transports",
  CAR: "/voitures",
  ACTIVITY: "/activites",
};
