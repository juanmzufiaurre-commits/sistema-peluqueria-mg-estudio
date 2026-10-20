import { z } from "zod";
import { normalizeArgentinePhone } from "@/lib/phone";

export const MAX_REFERENCE_PHOTOS = 3;

const photoSchema = z.object({
  secureUrl: z.url().refine((u) => u.startsWith("https://res.cloudinary.com/"), "Foto inválida"),
  publicId: z.string().min(1).max(200),
});

export const createBookingSchema = z.object({
  serviceId: z.string().min(1, "Elegí un servicio"),
  startsAt: z.iso.datetime({ message: "Elegí un horario" }),
  /** Profesional elegido por el cliente; null/ausente = el primero libre. */
  staffId: z.string().min(1).nullable().optional(),
  firstName: z.string().trim().min(2, "Ingresá tu nombre").max(60),
  lastName: z.string().trim().min(2, "Ingresá tu apellido").max(60),
  phone: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const normalized = normalizeArgentinePhone(value);
      if (!normalized) {
        ctx.addIssue({ code: "custom", message: "Ingresá un celular válido, con código de área (ej. 11 2345 6789)" });
        return z.NEVER;
      }
      return normalized;
    }),
  photos: z.array(photoSchema).max(MAX_REFERENCE_PHOTOS, `Máximo ${MAX_REFERENCE_PHOTOS} fotos`).default([]),
  /** Honeypot: los humanos no ven este campo, los bots lo completan. */
  website: z.string().max(0).optional(),
});

export type CreateBookingInput = z.input<typeof createBookingSchema>;
export type CreateBookingData = z.output<typeof createBookingSchema>;
