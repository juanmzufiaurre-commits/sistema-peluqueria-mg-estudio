"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import { serviceSchema } from "@/lib/validation/service";
import { getAdminUser } from "@/server/auth/admin";

const UNAUTHORIZED = "No autorizado. Volvé a iniciar sesión.";

function refresh() {
  updateTag("services"); // el wizard público lee la lista cacheada con este tag
  updateTag("catalog"); // el catálogo muestra el nombre del servicio de cada trabajo
  revalidatePath("/admin/servicios");
}

export async function createServiceAction(raw: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const last = await db.service.aggregate({ _max: { sortOrder: true } });
  await db.service.create({ data: { ...parsed.data, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
  refresh();
  return ok();
}

export async function updateServiceAction(id: unknown, raw: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  if (typeof id !== "string" || !id) return fail("Servicio inválido");
  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos");

  // Los turnos ya creados guardan su propio snapshot de precio y duración: editar no los altera.
  await db.service.update({ where: { id }, data: parsed.data });
  refresh();
  return ok();
}

/**
 * Eliminación definitiva. Los turnos existentes (pasados o futuros) no se tocan: guardan su propio
 * nombre, precio y duración, así que el historial y las métricas siguen igual. Solo pierden el
 * vínculo con el catálogo (serviceId queda en NULL por la clave foránea ON DELETE SET NULL).
 */
export async function deleteServiceAction(id: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const parsed = z.string().min(1).safeParse(id);
  if (!parsed.success) return fail("Servicio inválido");

  const service = await db.service.findUnique({ where: { id: parsed.data }, select: { id: true } });
  if (!service) return fail("El servicio no existe o ya fue eliminado.");

  await db.service.delete({ where: { id: service.id } });
  refresh();
  return ok();
}

const activeSchema = z.object({ id: z.string().min(1), isActive: z.boolean() });

/** Baja lógica: oculta el servicio al público sin perderlo; se puede reactivar. */
export async function setServiceActiveAction(raw: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return fail(UNAUTHORIZED);
  const parsed = activeSchema.safeParse(raw);
  if (!parsed.success) return fail("Datos inválidos");

  await db.service.update({ where: { id: parsed.data.id }, data: { isActive: parsed.data.isActive } });
  refresh();
  return ok();
}
