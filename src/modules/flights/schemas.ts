import { z } from "zod";

export const TRIP_TYPES = ["ONE_WAY", "ROUND_TRIP", "MULTI_CITY"] as const;

export const searchSchema = z.object({
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
});
export type FlightSearch = z.infer<typeof searchSchema>;
