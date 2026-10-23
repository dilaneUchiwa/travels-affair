import type { Booking, Tx } from "@/db";
import type { ServiceType } from "./service-types";

/** Libellé (clé i18n « detail.* ») et valeur d'une ligne de détail figée dans la réservation. */
export type DetailLine = [labelKey: string, value: string];

/** Ce qu'un service renvoie une fois son stock verrouillé : tout ce qui est photographié dans la réservation. */
export type Reservation = {
  itemId: string;
  title: string;
  subtitle: string;
  startAt: Date;
  endAt: Date;
  details: DetailLine[];
  conditions: string;
  cancellationPolicy: string;
  quantity: number;
  multiplier: number;
  unitPrice: number;
  currency: string;
};

/**
 * Port d'un type de service réservable (vol, hôtel, transport, voiture, activité).
 * Ajouter un nouveau service = écrire un adaptateur et l'enregistrer dans adapters/index.ts.
 */
export interface ServiceAdapter {
  type: ServiceType;
  /** Valide la demande, verrouille le stock dans la transaction et décrit la réservation. */
  reserve(tx: Tx, input: unknown): Promise<Reservation>;
  /** Rend le stock quand la réservation est annulée/remboursée (services à stock uniquement). */
  release?(tx: Tx, booking: Booking): Promise<void>;
}
