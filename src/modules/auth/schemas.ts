import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Le nom est requis."),
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});

export const forgotSchema = z.object({ email: z.string().trim().toLowerCase().email("Adresse e-mail invalide.") });

export const resetSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, "Lien invalide ou expiré."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});
