"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import { addDaysToDateString, zonedToUtc } from "@/lib/dates";
import { blockSchema, settingsSchema, workingHoursSchema } from "@/lib/validation/config";
import { getAdminUser } from "@/server/auth/admin";
import { ACTIVE_STATUSES, loadConfig } from "@/server/services/booking";

const UNAUTHORIZED = "No autorizado. Volvé a iniciar sesión.";

/** Reemplaza el horario general del local (los profesionales con horario propio no se tocan). */
export async function saveWorkingHoursAction(raw: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const parsed = workingHoursSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Horarios inválidos");

  await db.$transaction([
    db.workingHour.deleteMany({ where: { staffId: null } }),
    db.workingHour.createMany({
      data: parsed.data.ranges.map((r) => ({ staffId: null, weekday: r.weekday, startTime: r.start, endTime: r.end })),
    }),
  ]);
  revalidatePath("/admin/configuracion");
  return ok();
}

export async function saveSettingsAction(raw: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");

  await db.systemConfig.upsert({ where: { id: 1 }, update: parsed.data, create: { id: 1, ...parsed.data } });
  updateTag("config"); // nombre, dirección y WhatsApp se leen cacheados en la home
  revalidatePath("/admin/configuracion");
  return ok();
}

/** Crea un bloqueo (feriado, descanso, imprevisto). Avisa cuántos turnos activos quedan afectados. */
export async function createBlockAction(raw: unknown): Promise<ActionResult<{ affectedBookings: number }>> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const parsed = blockSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const b = parsed.data;
  const { timezone } = await loadConfig();

  const startsAt = zonedToUtc(b.startDate, b.startTime ?? "00:00", timezone);
  const endsAt = b.endTime ? zonedToUtc(b.endDate, b.endTime, timezone) : zonedToUtc(addDaysToDateString(b.endDate, 1), "00:00", timezone);

  await db.blockedPeriod.create({ data: { startDatetime: startsAt, endDatetime: endsAt, reason: b.reason } });
  const affectedBookings = await db.booking.count({
    where: { status: { in: ACTIVE_STATUSES }, startDatetime: { lt: endsAt }, endDatetime: { gt: startsAt } },
  });
  revalidatePath("/admin/configuracion");
  return ok({ affectedBookings });
}

export async function deleteBlockAction(id: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const parsed = z.string().min(1).safeParse(id);
  if (!parsed.success) return fail("Bloqueo inválido");
  await db.blockedPeriod.deleteMany({ where: { id: parsed.data } });
  revalidatePath("/admin/configuracion");
  return ok();
}
