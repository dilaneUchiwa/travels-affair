import { z } from "zod";
import { SERVICE_TYPES } from "./service-types";

export const MAX_PARTICIPANTS = 9;

const names = (label: string) =>
  z
    .string({ required_error: `${label} requis.` })
    .transform((v) => v.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))
    .pipe(
      z
        .array(z.string().min(2, "Nom trop court."))
        .min(1, `${label} requis.`)
        .max(MAX_PARTICIPANTS, `Maximum ${MAX_PARTICIPANTS} personnes par réservation.`),
    );

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");
const units = z.coerce.number().int().min(1, "Quantité invalide.").max(10, "Maximum 10.");

const base = { itemId: z.string().min(1, "Offre manquante.") };

export const createBookingSchema = z.discriminatedUnion("serviceType", [
  z.object({ ...base, serviceType: z.literal("FLIGHT"), participants: names("Passagers") }),
  z.object({ ...base, serviceType: z.literal("TRANSPORT"), participants: names("Passagers") }),
  z.object({ ...base, serviceType: z.literal("ACTIVITY"), participants: names("Participants") }),
  z.object({ ...base, serviceType: z.literal("HOTEL"), participants: names("Voyageurs"), checkIn: day, checkOut: day, units }),
  z.object({ ...base, serviceType: z.literal("CAR"), participants: names("Conducteur"), pickupDate: day, returnDate: day, units: units.default(1) }),
]);

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export { SERVICE_TYPES };
