import type { AnySQLiteTable } from "drizzle-orm/sqlite-core";
import type { ServiceType } from "@/modules/bookings/service-types";

export type Opt = { value: string; label: string };

export type SuggestKind = "city" | "country" | "airport" | "place";
type Base = { name: string; label: string; required?: boolean; help?: string; wide?: boolean; suggest?: SuggestKind };
export type Field = Base &
  (
    | { kind: "text" | "textarea" | "datetime" }
    | { kind: "number"; min?: number; max?: number; defaultValue?: number }
    | { kind: "select"; options: Opt[]; defaultValue?: string; asBoolean?: boolean }
    | { kind: "relation"; load: () => Promise<Opt[]> }
    | { kind: "currency" }
    | { kind: "photos" }
  );

export type Row = { id: string; cells: string[]; published?: boolean };

/**
 * Description déclarative d'une ressource administrable : le formulaire, la validation, la liste
 * et les actions (créer, modifier, publier, supprimer) sont tous dérivés de cette seule structure.
 */
export type Entity = {
  key: string; // segment d'URL : /admin/<key>
  table: AnySQLiteTable;
  idColumn?: string; // « id » par défaut ; « slug » pour les pages
  title: string;
  singular: string;
  group: "offers" | "catalog" | "content";
  fields: Field[];
  columns: string[];
  rows: () => Promise<Row[]>;
  publishable: boolean; // possède une colonne status DRAFT | PUBLISHED
  noCreate?: boolean;
  noDelete?: boolean;
  /** Règles métier croisées (ex. arrivée après départ). Lève une AppError. */
  refine?: (data: Record<string, unknown>) => void;
  /** Complète les données avant enregistrement (ex. copie du nom de la compagnie). */
  beforeSave?: (data: Record<string, unknown>) => Promise<void>;
  /** Nombre de réservations liées : une offre déjà réservée ne peut plus être supprimée (on la dépublie). */
  bookingsCount?: (id: string) => Promise<number>;
  bookingType?: ServiceType;
};
