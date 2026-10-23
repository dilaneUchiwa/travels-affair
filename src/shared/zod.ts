import { z } from "zod";

/** Les saisies datetime-local sont interprétées à l'heure de Douala (UTC+1, sans heure d'été). */
export const doualaDate = (msg: string) =>
  z.preprocess(
    (v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? `${v}:00+01:00` : v),
    z.coerce.date({ invalid_type_error: msg }),
  );
