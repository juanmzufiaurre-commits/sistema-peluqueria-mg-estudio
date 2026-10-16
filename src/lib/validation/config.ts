import { z } from "zod";
import { normalizeArgentinePhone } from "@/lib/phone";
import { timeToMinutes } from "@/lib/dates";

export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (HH:mm)");

const rangeSchema = z.object({ weekday: z.number().int().min(0).max(6), start: timeSchema, end: timeSchema });

export const workingHoursSchema = z
  .object({ ranges: z.array(rangeSchema).max(40) })
  .superRefine(({ ranges }, ctx) => {
    for (const r of ranges) {
      if (timeToMinutes(r.start) >= timeToMinutes(r.end)) {
        ctx.addIssue({ code: "custom", message: `El horario ${r.start}–${r.end} tiene el cierre antes de la apertura` });
        return;
      }
    }
    for (let day = 0; day < 7; day++) {
      const sorted = ranges.filter((r) => r.weekday === day).sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
      for (let i = 1; i < sorted.length; i++) {
        if (timeToMinutes(sorted[i].start) < timeToMinutes(sorted[i - 1].end)) {
          ctx.addIssue({ code: "custom", message: "Hay tramos horarios que se superponen en el mismo día" });
          return;
        }
      }
    }
  });

export const settingsSchema = z.object({
  businessName: z.string().trim().min(2, "Ingresá el nombre del local").max(80),
  address: z.string().trim().max(200).optional().transform((v) => v || null),
  whatsappNumber: z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) return null;
      const n = normalizeArgentinePhone(v);
      if (!n) {
        ctx.addIssue({ code: "custom", message: "El WhatsApp del local no es válido (ej. 11 2345 6789)" });
        return z.NEVER;
      }
      return n;
    }),
  bufferMinutes: z.coerce.number().int().min(0, "Mínimo 0").max(120, "Máximo 120 minutos"),
  slotStepMinutes: z.coerce.number().int().refine((n) => [5, 10, 15, 20, 30, 45, 60].includes(n), "Intervalo no permitido"),
  bookingWindowDays: z.coerce.number().int().min(1, "Mínimo 1 día").max(60, "Máximo 60 días"),
  sameDayCutoffTime: timeSchema,
  minCancelHours: z.coerce.number().int().min(0).max(72, "Máximo 72 horas"),
});

export const blockSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elegí la fecha de inicio"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elegí la fecha de fin"),
    /** Si faltan las horas, se bloquean los días completos. */
    startTime: timeSchema.optional().or(z.literal("").transform(() => undefined)),
    endTime: timeSchema.optional().or(z.literal("").transform(() => undefined)),
    reason: z.string().trim().max(120).optional().transform((v) => v || null),
  })
  .superRefine((b, ctx) => {
    if (b.endDate < b.startDate) ctx.addIssue({ code: "custom", message: "La fecha de fin es anterior a la de inicio" });
    if (Boolean(b.startTime) !== Boolean(b.endTime)) ctx.addIssue({ code: "custom", message: "Completá hora de inicio y de fin, o dejá ambas vacías para el día completo" });
    if (b.startTime && b.endTime && b.startDate === b.endDate && b.startTime >= b.endTime) ctx.addIssue({ code: "custom", message: "La hora de fin debe ser posterior a la de inicio" });
  });
