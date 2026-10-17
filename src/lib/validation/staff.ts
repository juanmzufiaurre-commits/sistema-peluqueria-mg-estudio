import { z } from "zod";

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((s) => s || null);

export const staffProfileSchema = z.object({
  name: z.string().trim().min(2, "Ingresá el nombre").max(40, "Máximo 40 caracteres"),
  role: optionalText(40, "Máximo 40 caracteres"),
  /** Acepta "@usuario", "usuario" o el enlace al perfil; se guarda solo el usuario. */
  instagram: z
    .string()
    .trim()
    .transform((s) =>
      s
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
        .replace(/^@/, "")
        .replace(/[/?#].*$/, ""),
    )
    .pipe(z.string().regex(/^[A-Za-z0-9._]{0,30}$/, "Usuario de Instagram inválido"))
    .transform((s) => s || null),
  certificate: optionalText(120, "Máximo 120 caracteres"),
});

export type StaffProfileInput = z.input<typeof staffProfileSchema>;

export const catalogCaptionSchema = optionalText(80, "Máximo 80 caracteres");
