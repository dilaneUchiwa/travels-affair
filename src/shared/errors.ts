/** Erreurs métier : leur message est destiné à l'utilisateur final. */
export class AppError extends Error {
  constructor(
    public readonly code: "VALIDATION" | "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "UNAUTHENTICATED",
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (msg = "Ressource introuvable.") => new AppError("NOT_FOUND", msg);
export const forbidden = (msg = "Action non autorisée.") => new AppError("FORBIDDEN", msg);
export const conflict = (msg: string) => new AppError("CONFLICT", msg);
export const invalid = (msg: string) => new AppError("VALIDATION", msg);
