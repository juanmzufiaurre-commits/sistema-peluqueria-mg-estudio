import { z } from "zod";

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((s) => s || null);

export const MAX_CERTIFICATES = 10;

export const certificateSchema = z.object({
  name: z.string().trim().min(2, "Ingresá el nombre del certificado").max(80, "Máximo 80 caracteres"),
  // El formulario pide la academia al agregar; vacía solo en certificados cargados antes de existir este campo.
  academy: z.string().trim().max(80, "Máximo 80 caracteres"),
});

export const staffNameSchema = z.string().trim().min(2, "Ingresá el nombre").max(40, "Máximo 40 caracteres");

export const staffProfileSchema = z.object({
  name: staffNameSchema,
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
  certificates: z.array(certificateSchema).max(MAX_CERTIFICATES, `Máximo ${MAX_CERTIFICATES} certificados`),
});

export type StaffProfileInput = z.input<typeof staffProfileSchema>;

export const catalogCaptionSchema = optionalText(80, "Máximo 80 caracteres");
