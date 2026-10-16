"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import { ACTIVE } from "@/lib/booking-status";
import { getAdminUser } from "@/server/auth/admin";
import { notifyCancellationByAdmin } from "@/server/services/notifications";
import { BookingError, getAdminSlots, isOverlapViolation, rescheduleBookingByAdmin } from "@/server/services/booking";

const UNAUTHORIZED = "No autorizado. Volvé a iniciar sesión.";

const statusSchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "NO_SHOW"]),
});

/** Cambia el estado operativo. Cancelar tiene su propia acción porque dispara el aviso al cliente. */
export async function setBookingStatusAction(raw: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const parsed = statusSchema.safeParse(raw);
  if (!parsed.success) return fail("Estado inválido");

  try {
    const current = await db.booking.findUnique({ where: { id: parsed.data.bookingId }, select: { status: true } });
    if (!current) return fail("El turno no existe");
    await db.booking.update({
      where: { id: parsed.data.bookingId },
      // Si estaba cancelado y se reactiva, la restricción de la base valida que el horario siga libre.
      data: { status: parsed.data.status, cancelledAt: null },
    });
    revalidatePath("/admin");
    return ok();
  } catch (error) {
    if (isOverlapViolation(error)) return fail("No se puede reactivar: ese horario ya fue tomado por otro turno.");
    console.error("setBookingStatusAction", error);
    return fail("No pudimos cambiar el estado.");
  }
}

/** Cancela por el local: libera el horario (la restricción solo mira estados activos). */
export async function cancelBookingByAdminAction(bookingId: unknown): Promise<ActionResult<{ autoSent: boolean }>> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  if (typeof bookingId !== "string" || !bookingId) return fail("Turno inválido");

  const booking = await db.booking.findUnique({ where: { id: bookingId }, select: { status: true } });
  if (!booking) return fail("El turno no existe");
  if (!(ACTIVE as readonly string[]).includes(booking.status)) return fail("Ese turno ya no está activo.");

  await db.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED_BY_ADMIN", cancelledAt: new Date() } });

  // Aviso inmediato por el gateway si está configurado; si falla o no hay gateway, la UI ofrece el enlace wa.me.
  let autoSent = false;
  try {
    autoSent = await notifyCancellationByAdmin(bookingId);
  } catch (error) {
    console.error("notifyCancellationByAdmin", error);
  }
  revalidatePath("/admin");
  return ok({ autoSent });
}

const noteSchema = z.object({
  clientId: z.string().min(1),
  bookingId: z.string().min(1).optional(),
  body: z.string().trim().min(1, "Escribí la nota").max(2000, "La nota es demasiado larga"),
});

export async function addClientNoteAction(raw: unknown): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return fail(UNAUTHORIZED);
  const parsed = noteSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");

  await db.clientNote.create({
    data: { clientId: parsed.data.clientId, bookingId: parsed.data.bookingId, body: parsed.data.body, authorId: admin.id },
  });
  revalidatePath("/admin");
  return ok();
}

const slotsSchema = z.object({ bookingId: z.string().min(1), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

/** Horarios libres de un día para mover un turno (modo admin: sin hora de corte ni ventana de 14 días). */
export async function getAdminSlotsAction(raw: unknown): Promise<ActionResult<string[]>> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const parsed = slotsSchema.safeParse(raw);
  if (!parsed.success) return fail("Datos inválidos");
  try {
    const slots = await getAdminSlots(parsed.data.bookingId, parsed.data.date);
    return ok(slots.map((s) => s.toISOString()));
  } catch (error) {
    if (error instanceof BookingError) return fail(error.message);
    console.error("getAdminSlotsAction", error);
    return fail("No pudimos cargar los horarios.");
  }
}

const moveSchema = z.object({ bookingId: z.string().min(1), startsAt: z.iso.datetime() });

export async function rescheduleBookingByAdminAction(raw: unknown): Promise<ActionResult<{ startsAt: string }>> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const parsed = moveSchema.safeParse(raw);
  if (!parsed.success) return fail("Datos inválidos");
  try {
    const b = await rescheduleBookingByAdmin(parsed.data.bookingId, new Date(parsed.data.startsAt));
    revalidatePath("/admin");
    return ok({ startsAt: b.startDatetime.toISOString() });
  } catch (error) {
    if (error instanceof BookingError) return fail(error.message);
    console.error("rescheduleBookingByAdminAction", error);
    return fail("No pudimos reprogramar el turno.");
  }
}
