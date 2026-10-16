import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Ingresá el nombre").max(60, "Máximo 60 caracteres"),
  description: z.string().trim().min(1, "Ingresá una descripción").max(300, "Máximo 300 caracteres"),
  /** Una línea por ítem: "Corte", "Barba", ... */
  includes: z
    .string()
    .transform((s) => s.split("\n").map((l) => l.trim()).filter(Boolean))
    .pipe(z.array(z.string().max(60)).max(15, "Máximo 15 ítems")),
  priceArs: z.coerce.number({ message: "Ingresá un precio" }).int("Sin centavos").min(0, "No puede ser negativo").max(10_000_000),
  durationMinutes: z.coerce.number({ message: "Ingresá la duración" }).int("Solo minutos enteros").min(5, "Mínimo 5 minutos").max(600, "Máximo 10 horas"),
});

export type ServiceFormInput = z.input<typeof serviceSchema>;
export type ServiceFormData = z.output<typeof serviceSchema>;
